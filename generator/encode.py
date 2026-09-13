"""WAV and variable bitrate MP3 output."""

import wave

import numpy as np

import dsp

# Variable bitrate, because roughly 85 per cent of a track is digital silence.
# Constant bitrate pays full price for that silence; VBR spends almost nothing
# on it. Quality 5 is transparent well beyond a 5 kHz ceiling.
VBR_QUALITY = 5
VBR_MIN_KBPS = 8
VBR_MAX_KBPS = 64

# LAME VBR mode. 4 is vbr_mtrh, the one LAME recommends. Note that passing True
# here selects mode 1, which LAME rejects as deprecated.
VBR_MTRH = 4


def _pcm(audio):
    return (np.clip(audio, -1.0, 1.0) * 32767).astype("<i2")


def write_wav(path, audio):
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(dsp.SAMPLE_RATE)
        handle.writeframes(_pcm(audio).tobytes())


def write_mp3(path, audio, quality=VBR_QUALITY):
    import lameenc

    encoder = lameenc.Encoder()
    encoder.set_in_sample_rate(dsp.SAMPLE_RATE)
    encoder.set_channels(1)
    encoder.set_quality(2)
    encoder.set_vbr(VBR_MTRH)
    encoder.set_vbr_quality(quality)
    encoder.set_vbr_min_bitrate_kbps(VBR_MIN_KBPS)
    encoder.set_vbr_max_bitrate_kbps(VBR_MAX_KBPS)

    data = encoder.encode(_pcm(audio).tobytes())
    data += encoder.flush()
    with open(path, "wb") as handle:
        handle.write(data)
    return len(data)
