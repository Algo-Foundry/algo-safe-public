from typing import Tuple
from pyteal import *

from pyteal import (
    And,
    App,
    Assert,
    Bytes,
    BytesZero,
    Concat,
    Expr,
    Extract,
    For,
    GetByte,
    If,
    Int,
    Itob,
    Len,
    Or,
    ScratchVar,
    Seq,
    SetByte,
    Subroutine,
    Substring,
    TealType,
)

_max_keys = 15
_page_size = 128 - 1  # need 1 byte for key
_max_bytes = _max_keys * _page_size
_max_bits = _max_bytes * 8

max_keys = Int(_max_keys)
page_size = Int(120) # bcause the key is 8 bytes, so the value 128 - 8
page_size_approvers = Int(117) # because the key is 11 bytes, so the value 128 - 11
max_bytes = Int(_max_bytes)


def _key_and_offset(idx: Int) -> Tuple[Int, Int]:
    return idx / page_size, idx % page_size


@Subroutine(TealType.bytes)
def intkey(i: Expr) -> Expr:
    return Extract(Itob(i), Int(7), Int(1))


# TODO: Add Keyspace range?
class LocalBlob:
    """
    Blob is a class holding static methods to work with the local storage of an account as a binary large object

    The `zero` method must be called on an account on opt in and the schema of the local storage should be 16 bytes
    """

    @staticmethod
    @Subroutine(TealType.none)
    def zero(key: Expr) :
        """
        initializes local state of an account to all zero bytes

        This allows us to be lazy later and _assume_ all the strings are the same size

        """
        return Seq([App.globalPut(key, BytesZero(page_size))])

    @staticmethod
    @Subroutine(TealType.none)
    def initZeroForApprovers(key: Expr) :
        """
        initializes local state of an account to all zero bytes

        This allows us to be lazy later and _assume_ all the strings are the same size

        """
        return Seq([App.globalPut(key, BytesZero(Int(117)))])

    @staticmethod
    @Subroutine(TealType.bytes)
    def read(
        idx: Expr, bstart: Expr, bend: Expr
    ) -> Expr:
        """
        read bytes between bstart and bend from local storage of an account by index
        """

        start_key, start_offset = _key_and_offset(bstart)
        stop_key, stop_offset = _key_and_offset(bend)

        key = ScratchVar()
        buff = ScratchVar()

        start = ScratchVar()
        stop = ScratchVar()

        init = key.store(start_key)
        cond = key.load() <= stop_key
        incr = key.store(key.load() + Int(1))

        return Seq(
            buff.store(Bytes("")),
            For(init, cond, incr).Do(
                Seq(
                    start.store(If(key.load() == start_key, start_offset, Int(0))),
                    stop.store(If(key.load() == stop_key, stop_offset, page_size)),
                    buff.store(
                        Concat(
                            buff.load(),
                            Substring(
                                App.globalGet(idx),
                                start.load(),
                                stop.load(),
                            ),
                        )
                    ),
                )
            ),
            buff.load(),
        )

    @staticmethod
    @Subroutine(TealType.bytes)
    def readForApprovers(
        idx: Expr, bstart: Expr, bend: Expr
    ) -> Expr:
        """
        read bytes between bstart and bend from local storage of an account by index
        """

        start_key, start_offset = _key_and_offset(bstart)
        stop_key, stop_offset = _key_and_offset(bend)

        key = ScratchVar()
        buff = ScratchVar()

        start = ScratchVar()
        stop = ScratchVar()

        init = key.store(start_key)
        cond = key.load() <= stop_key
        incr = key.store(key.load() + Int(1))

        return Seq(
            buff.store(Bytes("")),
            For(init, cond, incr).Do(
                Seq(
                    start.store(If(key.load() == start_key, start_offset, Int(0))),
                    stop.store(If(key.load() == stop_key, stop_offset, page_size_approvers)),
                    buff.store(
                        Concat(
                            buff.load(),
                            Substring(
                                App.globalGet(idx),
                                start.load(),
                                stop.load(),
                            ),
                        )
                    ),
                )
            ),
            buff.load(),
        )

    @staticmethod
    @Subroutine(TealType.uint64)
    def writeForApprovers(
        idx: Expr, bstart: Expr, buff: Expr
    ) -> Expr:
        """
        write bytes between bstart and len(buff) to the global states of a key
        """

        start_key, start_offset = _key_and_offset(bstart)
        stop_key, stop_offset = _key_and_offset(bstart + Len(buff))

        key = ScratchVar()
        start = ScratchVar()
        stop = ScratchVar()
        written = ScratchVar()

        init = key.store(start_key)
        cond = key.load() <= stop_key
        incr = key.store(key.load() + Int(1))

        delta = ScratchVar()

        return Seq(
            written.store(Int(0)),
            For(init, cond, incr).Do(
                Seq(
                    start.store(If(key.load() == start_key, start_offset, Int(0))),
                    stop.store(If(key.load() == stop_key, stop_offset, page_size_approvers)),
                    App.globalPut(
                        idx,
                        If(
                            Or(stop.load() != page_size_approvers, start.load() != Int(0))
                        )  # Its a partial write
                        .Then(
                            Seq(
                                delta.store(stop.load() - start.load()),
                                Concat(
                                    Substring(
                                        App.globalGet(idx),
                                        Int(0),
                                        start.load(),
                                    ),
                                    Extract(buff, written.load(), delta.load()),
                                    Substring(
                                        App.globalGet(idx),
                                        stop.load(),
                                        page_size_approvers
                                    ),
                                ),
                            )
                        )
                        .Else(
                            Seq(
                                delta.store(page_size_approvers),
                                Extract(buff, written.load(), page_size_approvers),
                            )
                        ),
                    ),
                    written.store(written.load() + delta.load()),
                )
            ),
            written.load(),
        )

    @staticmethod
    @Subroutine(TealType.uint64)
    def write(
        idx: Expr, bstart: Expr, buff: Expr
    ) -> Expr:
        """
        write bytes between bstart and len(buff) to local storage of an account
        """

        start_key, start_offset = _key_and_offset(bstart)
        stop_key, stop_offset = _key_and_offset(bstart + Len(buff))

        key = ScratchVar()
        start = ScratchVar()
        stop = ScratchVar()
        written = ScratchVar()

        init = key.store(start_key)
        cond = key.load() <= stop_key
        incr = key.store(key.load() + Int(1))

        delta = ScratchVar()

        return Seq(
            written.store(Int(0)),
            For(init, cond, incr).Do(
                Seq(
                    start.store(If(key.load() == start_key, start_offset, Int(0))),
                    stop.store(If(key.load() == stop_key, stop_offset, page_size)),
                    App.globalPut(
                        idx,
                        If(
                            Or(stop.load() != page_size, start.load() != Int(0))
                        )  # Its a partial write
                        .Then(
                            Seq(
                                delta.store(stop.load() - start.load()),
                                Concat(
                                    Substring(
                                        App.globalGet(idx),
                                        Int(0),
                                        start.load(),
                                    ),
                                    Extract(buff, written.load(), delta.load()),
                                    Substring(
                                        App.globalGet(idx),
                                        stop.load(),
                                        page_size
                                    ),
                                ),
                            )
                        )
                        .Else(
                            Seq(
                                delta.store(page_size),
                                Extract(buff, written.load(), page_size),
                            )
                        ),
                    ),
                    written.store(written.load() + delta.load()),
                )
            ),
            written.load(),
        )
