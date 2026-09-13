"""WAV and variable bitrate MP3 output."""

import fractions
import wave

import av
import numpy as np
from av.codec.context import Flags

import dsp

# Variable bitrate, because roughly 96 per cent of a track is digital silence.
# Constant bitrate pays full price for that silence; VBR spends almost nothing
# on it. Anything from 2 upwards gives the same result for this material: with
# no content above 5 kHz the encoder has nothing further to discard, so the
# setting saturates.
VBR_QUALITY = 5

# ffmpeg expresses a quality scale in units of FF_QP2LAMBDA.
QP2LAMBDA = 118

FRAME_SAMPLES = 1152        # one MPEG layer III granule pair


def _pcm(audio):
    return (np.clip(audio, -1.0, 1.0) * 32767).astype("<i2")


def write_wav(path, audio):
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(dsp.SAMPLE_RATE)
        handle.writeframes(_pcm(audio).tobytes())


def write_mp3(path, audio, quality=VBR_QUALITY):
    """
    Encode to variable bitrate MP3 and return the size written.

    The muxer is what puts the Xing header at the front of the file. Without it
    a player has no choice but to guess the length from the bitrate of the first
    frame, and on a track that is mostly silence that guess is wildly long.
    """
    samples = _pcm(audio)
    container = av.open(str(path), "w", format="mp3")
    stream = container.add_stream("libmp3lame", rate=dsp.SAMPLE_RATE)
    stream.codec_context.flags = stream.codec_context.flags | Flags.qscale
    stream.codec_context.global_quality = int(quality * QP2LAMBDA)

    resampler = av.AudioResampler(format="s16p", layout="mono", rate=dsp.SAMPLE_RATE)
    position = 0
    for start in range(0, len(samples), FRAME_SAMPLES):
        chunk = samples[start:start + FRAME_SAMPLES]
        frame = av.AudioFrame(format="s16", layout="mono", samples=len(chunk))
        frame.planes[0].update(chunk.tobytes())
        frame.sample_rate = dsp.SAMPLE_RATE
        frame.pts = position
        frame.time_base = fractions.Fraction(1, dsp.SAMPLE_RATE)
        position += len(chunk)
        for resampled in resampler.resample(frame):
            for packet in stream.encode(resampled):
                container.mux(packet)

    for packet in stream.encode(None):
        container.mux(packet)
    container.close()
    return path.stat().st_size
