"""Test fixtures. Puts the generator on the import path and loads the clips once."""

import pathlib
import sys

import pytest

GENERATOR = pathlib.Path(__file__).resolve().parents[2] / "generator"
sys.path.insert(0, str(GENERATOR))

import sources                                          # noqa: E402
from stimuli import Library                             # noqa: E402


@pytest.fixture(scope="session")
def library():
    """The real source recordings, from the local cache. Decoding is slow, so once."""
    try:
        return Library(sources.load_cached())
    except FileNotFoundError as missing:
        pytest.skip(str(missing))
