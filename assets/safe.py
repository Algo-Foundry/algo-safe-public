# Contract Account

# Add directory to path so that algobpy can be imported
import sys
sys.path.insert(0,'.')
from local_blob import LocalBlob

from pyteal import *

def safe_approval():
    '''
    Safe Contract
    '''

    MAX_PTXN = Int(21)
    MAX_PTXN_PER_OWNER = Int(10)

    blob = LocalBlob()

    FOUNDRY_SAFE_IDENTIFIER = Bytes("Zm91bmRyeXNhZmV1Y2M=")

    @Subroutine(TealType.uint64)
    def getMasterKey(appid : Expr, key : Expr) -> Expr:
        maybe = App.globalGetEx(appid, key)
        return Seq(maybe, Assert(maybe.hasValue()), maybe.value())

    @Subroutine(TealType.bytes)
    def getTreasuryAddr(appid : Expr, key : Expr) -> Expr:
        maybe = App.globalGetEx(appid, key)
        return Seq(maybe, Assert(maybe.hasValue()), maybe.value())

    @Subroutine(TealType.bytes)
    def get_sig_address(program: Expr):
        # We could iterate over N items and encode them for a more general interface
        # but we inline them directly here

        return Sha512_256(
            Concat(
                Bytes("Program"),
                program,
            )
        )

    def assert_common_checks(e) -> Expr:
        return Assert(And(
            e.rekey_to() == Global.zero_address(),
            e.close_remainder_to() == Global.zero_address(),
            e.asset_close_to() == Global.zero_address()
        ))

    @Subroutine(TealType.none)
    def is_initialized() -> Expr:
        return Assert(App.globalGet(Bytes("init")) == Int(1))

    @Subroutine(TealType.none)
    def put_user_approval(seq: Expr, appr: Expr, _oIdx: Expr) -> Expr:
        oIdx = ScratchVar(TealType.uint64)
        bStart = ScratchVar(TealType.uint64)
        return Seq([

            # 1 means approve, 2 means reject, 0 means user havent giving the approvals
            Assert(Or(
                appr == Int(1), appr == Int(2)
            )),

            # Get sender index from the senders' list
            oIdx.store(_oIdx),

            # Calculate the bstart, based on the owner's index
            # owner 1 -> bstart 0; owner 2 -> bstart 1
            bStart.store((oIdx.load() - Int(1))),

            Pop(blob.writeForApprovers(
                Concat(
                    seq, 
                    Bytes("_a")
                ), 
                    bStart.load(), 
                    intkey(appr) # 1 byte size
                )
            ),
        ])

    @Subroutine(TealType.uint64)
    def get_user_approval(seq: Expr, _oIdx: Expr) -> Expr:
        oIdx = ScratchVar(TealType.uint64)
        bStart = ScratchVar(TealType.uint64)
        res = ScratchVar(TealType.bytes)
        return Seq([

            # 1 means approve, 2 means reject, 0 means no approval being given

            # Get sender index from the senders' list
            oIdx.store(_oIdx),

            # Calculate the bstart, based on the owner's index
            # owner 1 -> bstart 0; owner 2 -> bstart 1
            bStart.store(oIdx.load() - Int(1)),

            res.store(
                blob.readForApprovers(
                    Concat(
                        seq, 
                        Bytes("_a")
                    ), 
                    bStart.load(), 
                    bStart.load() + Int(1)
                    )
            ),

            Btoi(res.load()),

        ])


    @Subroutine(TealType.uint64)
    def is_key_exists(key : Expr) -> Expr:
        maybe = App.globalGetEx(Global.current_application_id(), key)
        isExists = ScratchVar(TealType.uint64)
        return Seq([
            isExists.store(Int(0)),
            maybe,
            If(maybe.hasValue(), isExists.store(Int(1))),
            isExists.load(),
        ])

    @Subroutine(TealType.none)
    def ownerOptin():
        opt = ScratchVar(TealType.uint64)
        return Seq([
            opt.store(App.optedIn(Txn.sender(), Global.current_application_id())),

            If(opt.load() == Int(0), Reject()),
        ])

    @Subroutine(TealType.bytes)
    def intkey(i: Expr) -> Expr:
        return Extract(Itob(i), Int(7), Int(1))

    @Subroutine(TealType.uint64)
    def ownerCheck(sender: Expr):
        # sender/address we want to check
        # Return the index of the owner
        o = ScratchVar(TealType.uint64)
        idx = ScratchVar(TealType.uint64)
        name = ScratchVar(TealType.bytes)
        a = ScratchVar(TealType.bytes)
        f = ScratchVar(TealType.uint64) # owner index

        b = ScratchVar(TealType.uint64)

        return Seq([

            # Loop break indicator
            b.store(Int(0)),

            f.store(Int(0)),

            # Total number of owner
            o.store(App.globalGet(Bytes("owners"))),

            idx.store(Int(1)),

            While(And(idx.load() <= o.load(), b.load() == Int(0))).Do(Seq([
                name.store(Concat(
                    Bytes("owner_"),
                    itoa(idx.load())
                )),

                # Address (32 bytes) | owner name len (8 bytes) | current ptxn count (1 byte) | owner name (40 - XX bytes)
                a.store(
                    Substring(
                        App.globalGet(name.load()),
                        Int(0),
                        Int(32)
                    )
                ),

                # Stop the loop
                If(a.load() == sender, Seq([
                    f.store(idx.load()),
                    b.store(Int(1)),
                ])),

                idx.store(idx.load() + Int(1)),
            ])),

            # Reject if not found
            If(f.load() == Int(0), Reject()),

            f.load(),

        ])

    @Subroutine(TealType.bytes)
    def itoa(i):
        """itoa converts an integer to the ascii byte string it represents"""
        return If(
            i == Int(0),
            Bytes("0"),
            Concat(
                If(i / Int(10) > Int(0), itoa(i / Int(10)), Bytes("")),
                Extract(Bytes("0123456789"), i % Int(10), Int(1))
            ),
        )

    '''
    returns current ptxn count for owner
    '''
    @Subroutine(TealType.uint64)
    def get_ptxn_count(owner_id: Expr):
        ptxn_count = ScratchVar(TealType.uint64)
        owner_data = ScratchVar(TealType.bytes)
        name = ScratchVar(TealType.bytes)

        return Seq([
            name.store(Concat(
                Bytes("owner_"), 
                itoa(owner_id)
            )),
            owner_data.store(App.globalGet(name.load())),

            # Address (32 bytes) | owner name len (8 bytes) | current ptxn count (1 byte) | owner name (40 - XX bytes)
            ptxn_count.store(Btoi(Substring(owner_data.load(), Int(40), Int(41)))),
            ptxn_count.load()
        ])

    '''
    set ptxn count for owner
    '''
    @Subroutine(TealType.none)
    def set_ptxn_count(owner_id: Expr, ptxn_count: Expr):
        owner_data = ScratchVar(TealType.bytes)
        name = ScratchVar(TealType.bytes)

        return Seq([
            name.store(Concat(
                Bytes("owner_"), 
                itoa(owner_id)
            )),
            owner_data.store(App.globalGet(name.load())),

            # Address (32 bytes) | owner name len (8 bytes) | current ptxn count (1 byte) | owner name (40 - XX bytes)
            App.globalPut(
                name.load(), 
                Concat(
                    Substring(owner_data.load(), Int(0), Int(40)),
                    intkey(ptxn_count), # 1 byte
                    Substring(owner_data.load(), Int(41), Len(owner_data.load())),
                )
            ),
            Return()
        ])

    def del_safe():
        is_exists = ScratchVar(TealType.uint64)
        is_apr = ScratchVar(TealType.uint64)

        apr = ScratchVar(TealType.uint64)
        rej = ScratchVar(TealType.uint64)

        user_opts = ScratchVar(TealType.uint64)

        _oIdx = ScratchVar(TealType.uint64)

        return Seq([
            # only the opted in owner can make a call
            _oIdx.store(ownerCheck(Txn.sender())),
            ownerOptin(),

            is_initialized(),

            # 2 atomic txs
            Assert(
                Global.group_size() == Int(2),
            ),

            # Nop calls
            Assert(And(
                Gtxn[0].type_enum() == TxnType.ApplicationCall,
                Gtxn[0].application_id() == Global.current_application_id(),
                Gtxn[0].application_args[0] == Bytes("nop"),
            )),
            assert_common_checks(Gtxn[0]),

            # this call
            Assert(And(
                Txn.type_enum() == TxnType.ApplicationCall,
                Txn.application_args[0] == Bytes("del_safe"),
                Txn.application_id() == Global.current_application_id(),
            )),
            assert_common_checks(Txn),

            # Check if "delete" key already exists in global state
            is_exists.store(is_key_exists(Bytes("d"))),

            If(is_exists.load() == Int(0), Seq([
                # Create a new key
                Assert(Txn.application_args.length() == Int(1)),

                # Initiate the blob
                blob.zero(Bytes("d")),

                # Approvers (8 bytes) | Rejections (8 bytes) | TX ID (32 bytes) | Initiator (32 bytes)
                Pop(blob.write(Bytes("d"), Int(0), Itob(Int(1)))),
                Pop(blob.write(Bytes("d"), Int(8), Itob(Int(0)))),
                Pop(blob.write(Bytes("d"), Int(16), Txn.tx_id())),
                Pop(blob.write(Bytes("d"), Int(48), Txn.sender())),

                # Sequence 0 means delete safe tx                
                # Init the byte value for storing the approvers/rejections
                blob.initZeroForApprovers(Concat(Itob(Int(0)), Bytes("_a"))),
                # Write the sender options - automatically true
                put_user_approval(Itob(Int(0)), Int(1), _oIdx.load()),
            ]), Seq([
                # Update
                Assert(Txn.application_args.length() == Int(2)),

                # reject (0), approve (1)
                is_apr.store(Btoi(Txn.application_args[1])),

                # Assert the user options. Must be either 2
                Assert(Or(
                    is_apr.load() == Int(0), # reject
                    is_apr.load() == Int(1) # approve
                )),

                # User/sender choice
                # 1 approve, 2 reject, 0 user havent voted
                user_opts.store(get_user_approval(Itob(Int(0)), _oIdx.load())),

                # Get the number of approvals and rejections
                apr.store(Btoi(blob.read(Bytes("d"), Int(0), Int(8)))),
                rej.store(Btoi(blob.read(Bytes("d"), Int(8), Int(16)))),

                If(is_apr.load() == Int(0), 
                Seq([
                    # Sender is trying to reject
                    # Check user's choice
                    Assert(
                        user_opts.load() != Int(2), # 2 means reject
                    ),

                    # User previously approves it, now change it to reject it
                    If(user_opts.load() == Int(1), Seq([
                        # Need to decrement the approve global state
                        apr.store(apr.load() - Int(1)),
                        Pop(blob.write(Bytes("d"), Int(0), Itob(apr.load()))),
                    ])),

                    # Increment the reject state
                    rej.store(rej.load() + Int(1)),
                    Pop(blob.write(Bytes("d"), Int(8), Itob(rej.load()))),

                    # Update user's vote
                    put_user_approval(Itob(Int(0)), Int(2), _oIdx.load()),

                ]), Seq([
                    # Approve
                    Assert(
                        user_opts.load() != Int(1), # 1 means approve
                    ),

                    # User previously reject it, now change it to approve it
                    If(user_opts.load() == Int(2), Seq([
                        # Need to decrement the reject global state
                        rej.store(rej.load() - Int(1)),
                        Pop(blob.write(Bytes("d"), Int(8), Itob(rej.load()))),
                    ])),

                    # Increment the approve state
                    apr.store(apr.load() + Int(1)),
                    Pop(blob.write(Bytes("d"), Int(0), Itob(apr.load()))),

                    # Update user's vote
                    put_user_approval(Itob(Int(0)), Int(1), _oIdx.load()),
                ])),
            ])),

            Approve(),
        ])

    def tx_vote():
        seq = ScratchVar(TealType.bytes)
        tx = ScratchVar(TealType.bytes)
        userOpts = ScratchVar(TealType.uint64)

        isApr = ScratchVar(TealType.uint64)
        apr = ScratchVar(TealType.uint64)
        rej = ScratchVar(TealType.uint64)

        lvRound = ScratchVar(TealType.uint64)

        _oIdx = ScratchVar(TealType.uint64)

        return Seq([
            # only the opted in owner can make a call
            _oIdx.store(ownerCheck(Txn.sender())),
            ownerOptin(),

            is_initialized(),

            # 2 Atomic Transactions
            # 1. "nop" to reserve more compute power
            # 2. "tx_vote" call

            # 2 atomic transactions
            Assert(Global.group_size() == Int(2),),

            # First payment - "nop" call to reserve more compute
            Assert(And(
                Gtxn[0].type_enum() == TxnType.ApplicationCall,
                Gtxn[0].application_id() == Global.current_application_id(),
                Gtxn[0].application_args[0] == Bytes("nop"),
            )),
            assert_common_checks(Gtxn[0]),

            # This payment
            Assert(And(
                Txn.type_enum() == TxnType.ApplicationCall,
                Txn.application_args[0] == Bytes("tx_vote"),
                Txn.application_args.length() == Int(3),
                Txn.application_id() == Global.current_application_id(),
            )),
            assert_common_checks(Txn),

            # get the sequence user wants to sign
            seq.store(Txn.application_args[1]),

            # Get last valid round
            lvRound.store(Btoi(blob.read(seq.load(), Int(98), Int(106)))),
            # Only can vote the valid transaction
            Assert(
                lvRound.load() >= Global.round()
            ),

            # Get the transaction object & assert it
            tx.store(App.globalGet(seq.load())),
            Assert(
                Len(tx.load()) == Int(120)
            ),

            # Get the number of approvals and rejections
            apr.store(Btoi(blob.read(seq.load(), Int(32), Int(33)))),
            rej.store(Btoi(blob.read(seq.load(), Int(33), Int(34)))),

            # Get the user options, whether reject (0), or approve (1)
            isApr.store(Btoi(Txn.application_args[2])),

            # Assert the user options. Must be either 2
            Assert(Or(
                isApr.load() == Int(0), # reject
                isApr.load() == Int(1) # approve
            )),

            # User options
            # 1 approve, 2 reject, 0 user havent voted
            userOpts.store(get_user_approval(seq.load(), _oIdx.load())),

            If(isApr.load() == Int(0), Seq([
                # Reject
                # Check user's local state
                Assert(
                    userOpts.load() != Int(2), # 2 means reject
                ),

                # User previously approves it, now change it to reject it
                If(userOpts.load() == Int(1), Seq([
                    # Need to decrement the global state
                    apr.store(apr.load() - Int(1)),
                    Pop(blob.write(seq.load(), Int(32), intkey(apr.load()))),
                ])),

                # Update user option state
                put_user_approval(seq.load(), Int(2), _oIdx.load()),

                # Increment the global tx state of rejection
                rej.store(rej.load() + Int(1)),
                Pop(blob.write(seq.load(), Int(33), intkey(rej.load()))),

            ]), Seq([
                # Approve
                # Check user's local state
                Assert(
                    userOpts.load() != Int(1), # 1 means reject
                ),

                # User previously reject it, now change it to approve it
                If(userOpts.load() == Int(2), Seq([
                    # Need to decrement the global state
                    rej.store(rej.load() - Int(1)),
                    Pop(blob.write(seq.load(), Int(33), intkey(rej.load()))),
                ])),

                # Update user option state
                put_user_approval(seq.load(), Int(1), _oIdx.load()),

                # Increment the tx global state of approvals
                apr.store(apr.load() + Int(1)),
                Pop(blob.write(seq.load(), Int(32), intkey(apr.load()))),
            ])),

            Approve(),
        ])

    def tx_remove():
        seq = ScratchVar(TealType.bytes)
        tx = ScratchVar(TealType.bytes)
        lvRound = ScratchVar(TealType.uint64)
        initiator = ScratchVar(TealType.bytes)
        initiator_id = ScratchVar(TealType.uint64)
        ptxn_count = ScratchVar(TealType.uint64)
        curr_ptxn_count = ScratchVar(TealType.uint64)
        ptxs = ScratchVar(TealType.uint64)

        return Seq([
            # only the opted in owner can make a call
            Pop(ownerCheck(Txn.sender())),
            ownerOptin(),

            is_initialized(),

            # 1 atomic transactions
            Assert(
                And(
                    Global.group_size() == Int(1),
                    Txn.application_args.length() == Int(2),
                )
            ),
            assert_common_checks(Txn),

            # TX Sequence we want to remove
            seq.store(Txn.application_args[1]),
            # Get the transaction object & assert it
            tx.store(App.globalGet(seq.load())),
            Assert(
                Len(tx.load()) == Int(120)
            ),

            # Get last valid round
            lvRound.store(Btoi(blob.read(seq.load(), Int(98), Int(106)))),
            # This last valid round must be smaller than global current round
            Assert(
                lvRound.load() < Global.round()
            ),

            # Get initiator
            initiator.store(blob.read(seq.load(), Int(66), Int(98))),

            # Update ptxn count for initiator
            initiator_id.store(ownerCheck(initiator.load())),
            ptxn_count.store(get_ptxn_count(initiator_id.load())),
            If(ptxn_count.load() > Int(0), Seq([
                curr_ptxn_count.store(ptxn_count.load() - Int(1)),
                set_ptxn_count(initiator_id.load(), curr_ptxn_count.load())
            ])),

            # Update total ptxn count
            ptxs.store(App.globalGet(Bytes("ptxs"))),
            ptxs.store(ptxs.load() - Int(1)),
            App.globalPut(Bytes("ptxs"), ptxs.load()),

            # Remove the states
            App.globalDel(seq.load()),
            App.globalDel(Concat(seq.load(), Bytes("_a"))),

            Approve(),
        ])

    def tx_exec():
        thres = ScratchVar(TealType.uint64)
        lvRound = ScratchVar(TealType.uint64)

        tx = ScratchVar(TealType.bytes)
        seq = ScratchVar(TealType.bytes)
        apr = ScratchVar(TealType.uint64)
        rej = ScratchVar(TealType.uint64)

        ca = ScratchVar(TealType.bytes)
        ptxs = ScratchVar(TealType.uint64)

        initiator = ScratchVar(TealType.bytes)
        initiator_id = ScratchVar(TealType.uint64)
        ptxn_count = ScratchVar(TealType.uint64)
        curr_ptxn_count = ScratchVar(TealType.uint64)

        return Seq([

            # only the opted in owner can make a call
            Pop(ownerCheck(Txn.sender())),
            ownerOptin(),

            is_initialized(),

            # 2 atomic transactions
            Assert(Global.group_size() == Int(2)),

            # First payment - "nop" call to reserve more compute
            Assert(And(
                Gtxn[0].type_enum() == TxnType.ApplicationCall,
                Gtxn[0].application_id() == Global.current_application_id(),
                Gtxn[0].application_args[0] == Bytes("nop"),
            )),
            
            assert_common_checks(Txn),

            seq.store(Txn.application_args[1]),
            # Get the transaction object & assert it
            tx.store(App.globalGet(seq.load())),
            Assert(
                Len(tx.load()) == Int(120)
            ),

            # Get the number of approvals and rejections
            apr.store(Btoi(blob.read(seq.load(), Int(32), Int(33)))),
            rej.store(Btoi(blob.read(seq.load(), Int(33), Int(34)))),
            thres.store(App.globalGet(Bytes("thres"))),

            # Get last valid round
            lvRound.store(Btoi(blob.read(seq.load(), Int(98), Int(106)))),
            # We need to make sure the last valid round is greater than the current round
            Assert(
                lvRound.load() >= Global.round()
            ),

            Assert(
                Or(
                    apr.load() >= thres.load(),
                    rej.load() >= thres.load(),
              )
            ),

            # Rejections
            If(And(rej.load() >= thres.load(), apr.load() < thres.load()), Seq([
                App.globalDel(seq.load()),
                App.globalDel(Concat(seq.load(), Bytes("_a"))),
                Approve(),
            ])),

            # Approvals

            # CA Address
            ca.store(blob.read(seq.load(), Int(0), Int(32))),

            # Rekey to the CA Address
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields(
                {
                    TxnField.type_enum: TxnType.Payment,
                    TxnField.amount: Int(0),
                    TxnField.receiver: Global.current_application_address(),
                    TxnField.rekey_to: ca.load(),
                    TxnField.fee: Int(0),
                }
            ),
            InnerTxnBuilder.Submit(),

            # Move [seq] global state to p global state
            App.globalPut(Bytes("p"), App.globalGet(seq.load())),

            # Get initiator
            initiator.store(blob.read(seq.load(), Int(66), Int(98))),

            # Update ptxn count for initiator
            initiator_id.store(ownerCheck(initiator.load())),
            ptxn_count.store(get_ptxn_count(initiator_id.load())),
            If(ptxn_count.load() > Int(0), Seq([
                curr_ptxn_count.store(ptxn_count.load() - Int(1)),
                set_ptxn_count(initiator_id.load(), curr_ptxn_count.load())
            ])),

            # Remove from the state and set a flag
            # The flag is being removed when its rekey is being undo
            App.globalDel(seq.load()),
            App.globalDel(Concat(seq.load(), Bytes("_a"))),

            # Decrease the total number of pending txs
            # Since the executed one (which is not really being submitted to Blockchain)
            # is being removed, so we have 1 more storage for storing pending transaction
            ptxs.store(App.globalGet(Bytes("ptxs"))),
            ptxs.store(ptxs.load() - Int(1)),
            App.globalPut(Bytes("ptxs"), ptxs.load()),

            Approve(),
        ])

    def tx_create():
        s = ScratchVar(TealType.uint64)
        seq = ScratchVar(TealType.bytes)

        sig_addr = ScratchVar(TealType.bytes)

        initiator = ScratchVar(TealType.bytes)

        _oIdx = ScratchVar(TealType.uint64)
        ptxs = ScratchVar(TealType.uint64)

        owner_ptxn_count = ScratchVar(TealType.uint64)
        curr_ptxn_count = ScratchVar(TealType.uint64)

        return Seq([
            # only the opted in owner can make a call
            _oIdx.store(ownerCheck(Txn.sender())),
            ownerOptin(),

            is_initialized(),

            # limit the number of active ptxn per safe owner
            owner_ptxn_count.store(get_ptxn_count(_oIdx.load())),
            Assert( 
                owner_ptxn_count.load() < MAX_PTXN_PER_OWNER
            ),

            # 3 Atomic Transactions
            # 1. O pay to CA
            # 2. "nop" to reserve more compute power
            # 3. "nop" to reserve more compute power
            # 4. "tx_create" call

            # 4 atomic transactions
            # Check total pending transaction
            ptxs.store(App.globalGet(Bytes("ptxs"))),
            Assert(
                And(
                    Global.group_size() == Int(4),
                    ptxs.load() < MAX_PTXN
                )
            ),

            # First payment - Payment to the CA
            Assert(And(
                Gtxn[0].type_enum() == TxnType.Payment,
                Gtxn[0].amount() >= Int(101000), # Min algo account
                Gtxn[0].receiver() == Txn.accounts[1], # Accounts 1 should be the CA Address
                Gtxn[0].sender() == Txn.sender(),
            )),
            initiator.store(Gtxn[0].sender()),
            assert_common_checks(Gtxn[0]),

            # Second payment - "nop" call to reserve more compute
            Assert(And(
                Gtxn[1].type_enum() == TxnType.ApplicationCall,
                Gtxn[1].application_id() == Global.current_application_id(),
                Gtxn[1].application_args[0] == Bytes("nop"),
            )),
            assert_common_checks(Gtxn[1]),

            # third payment - "nop" call to reserve more compute
            Assert(And(
                Gtxn[2].type_enum() == TxnType.ApplicationCall,
                Gtxn[2].application_id() == Global.current_application_id(),
                Gtxn[2].application_args[0] == Bytes("nop"),
            )),
            assert_common_checks(Gtxn[2]),

            # Forth payment - this tx create call
            Assert(And(
                Txn.type_enum() == TxnType.ApplicationCall,
                # The second one is the last valid round, the third one is the signature
                Txn.application_args.length() == Int(3),
                Txn.application_args[0] == Bytes("tx_create"),
                Txn.application_id() == Global.current_application_id(),
                Txn.accounts.length() == Int(1),
                # The last valid round should be bigger than the current round
                Btoi(Txn.application_args[1]) >= Global.round(),
            )),
            assert_common_checks(Gtxn[3]),

            # Validate the signature
            # Only the master hold the public key
            # Fee paid by the user
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields(
                {
                    TxnField.type_enum: TxnType.ApplicationCall,
                    TxnField.application_id: App.globalGet(Bytes("master")),
                    TxnField.application_args: [Bytes("nop")],
                    TxnField.fee: Int(0),
                }
            ),
            InnerTxnBuilder.Next(),
            InnerTxnBuilder.SetFields(
                {
                    TxnField.type_enum: TxnType.ApplicationCall,
                    TxnField.application_id: App.globalGet(Bytes("master")),
                    TxnField.application_args: [Bytes("signatureCheck"), Txn.application_args[2]],
                    TxnField.accounts: [Txn.accounts[1]],
                    TxnField.fee: Int(0),
                }
            ),
            InnerTxnBuilder.Submit(),

            # This line is important! We need to validate that the program bytes
            # passed in the note is the same as the ca address passed in the accounts
            sig_addr.store(get_sig_address(Txn.note())),
            Assert(sig_addr.load() == Txn.accounts[1]),

            # Increment the sequence
            s.store(App.globalGet(Bytes("seq"))),
            s.store(s.load() + Int(1)),

            # Convert the seq to bytes
            seq.store(Itob(s.load())),

            # Correct len bytes for address?
            Assert(Len(Txn.accounts[1]) == Int(32)),

            # Initiate the blob
            blob.zero(seq.load()),

            # CA Addr (32 bytes) | Approvers (1 bytes) | Rejections (1 bytes) | TX ID (32 bytes) | Initiator (32 bytes) | Last Valid Round (8 bytes)
            # see the docs to more complete explanations
            # Write the CA Address
            Pop(blob.write(seq.load(), Int(0), Txn.accounts[1])),
            # Write the approvers - By default is 1 because we're assuming the caller approve this tx 
            # (because he's making it right?)
            Pop(blob.write(seq.load(), Int(32), intkey(Int(1)))),
            # Write the rejections
            Pop(blob.write(seq.load(), Int(33), intkey(Int(0)))),
            # Write the TX ID
            Pop(blob.write(seq.load(), Int(34), Txn.tx_id())),
            # Write the initiator - for validation close remainder
            Pop(blob.write(seq.load(), Int(66), initiator.load())),
            # Write the last valid round - so when transaction is expired, any of the owner can remove it
            Pop(blob.write(seq.load(), Int(98), Txn.application_args[1])),

            App.globalPut(Bytes("seq"), s.load()),

            # Init the byte value for storing the approvers/rejections
            blob.initZeroForApprovers(Concat(seq.load(), Bytes("_a"))),

            # Write the sender options - automatically true
            put_user_approval(seq.load(), Int(1), _oIdx.load()),

            # Get the pending txs
            ptxs.store(ptxs.load() + Int(1)),
            App.globalPut(Bytes("ptxs"), ptxs.load()),

            # Update current no. of ptxn for this owner
            curr_ptxn_count.store(owner_ptxn_count.load() + Int(1)),
            set_ptxn_count(_oIdx.load(), curr_ptxn_count.load()),

            Approve(),
        ])

    def init():
        treasury = ScratchVar(TealType.bytes)
        fee = ScratchVar(TealType.uint64)
        master = ScratchVar(TealType.bytes)
        minTopup = ScratchVar(TealType.uint64)
        return Seq([
            # 4 atomic transactions
            Assert(And(
                Global.group_size() == Int(3),
                App.globalGet(Bytes("init")) == Int(0)
            )),

            # Only callable if the safe is not initialized yet
            # Callable by one of the owners
            Pop(ownerCheck(Txn.sender())),

            master.store(App.globalGet(Bytes("master"))),
            fee.store(getMasterKey(master.load(), Bytes("fee"))),
            treasury.store(getTreasuryAddr(master.load(), Bytes("addr"))),

            # First payment
            Assert(And(
                Gtxn[0].type_enum() == TxnType.Payment,
                Gtxn[0].receiver() == treasury.load(),
                Gtxn[0].amount() == fee.load(),
                Gtxn[0].sender() == Txn.sender(),
            )),
            assert_common_checks(Gtxn[0]),

            # 2nd payment should be top up to the safe
            minTopup.store(getMasterKey(master.load(), Bytes("min"))),
            Assert(And(
                Gtxn[1].type_enum() == TxnType.Payment,
                Gtxn[1].receiver() == Global.current_application_address(),
                Gtxn[1].amount() >= minTopup.load(),
                Gtxn[1].sender() == Txn.sender(),
            )),
            assert_common_checks(Gtxn[1]),

            Assert(
                And(
                    Txn.type_enum() == TxnType.ApplicationCall,
                    Txn.application_args.length() == Int(1),
                    Txn.application_args[0] == Bytes("init"),
                    Txn.application_id() == Global.current_application_id(),
                    (Global.group_size() - Int(1)) == Txn.group_index(),
                )
            ),
            assert_common_checks(Txn),

            # All good, make it initialized
            App.globalPut(Bytes("init"), Int(1)),

            Approve(),
        ])

    def getOnCreate():
        idx = ScratchVar(TealType.uint64)
        name = ScratchVar(TealType.bytes)
        ownerNameLen = ScratchVar(TealType.uint64)
        thres = ScratchVar(TealType.uint64)

        addr = ScratchVar(TealType.bytes)

        return Seq([

            # 2 atomic transaction
            Assert(Global.group_size() == Int(2)),

            # First payment - NOP call to the Master
            Assert(And(
                Gtxn[0].type_enum() == TxnType.ApplicationCall,
                Gtxn[0].application_id() == Txn.applications[1],
                Gtxn[0].application_args[0] == Bytes("nop"),
            )),
            assert_common_checks(Gtxn[0]),

            # Assert this transaction
            Assert(And(
                Txn.application_args.length() >= Int(3), # Min 1 thres, 1 safe name, 1 owner
                Txn.application_args.length() <= Int(12), # 1 thres, 1 safe name, max 10 owners
                Txn.applications.length() == Int(1), # master contract
                (Len(Txn.application_args[1])) <= Int(15), # safe name max 15 characters
            )),
            assert_common_checks(Txn),    

            # Check the number of owners and the threshold
            thres.store(Btoi(Txn.application_args[0])),
            Assert(
                # total of owners >= threshold
                (Txn.application_args.length() - Int(2)) >= thres.load(),
            ),

            # Make it un-initialized yet
            App.globalPut(Bytes("init"), Int(0)),
            App.globalPut(Bytes("thres"), thres.load()),
            App.globalPut(Bytes("master"), Txn.applications[1]),
            App.globalPut(Bytes("seq"), Int(0)),
            App.globalPut(Bytes("foundrysafe"), FOUNDRY_SAFE_IDENTIFIER),
            App.globalPut(Bytes("ptxs"), Int(0)),

            # Store the safe name
            App.globalPut(Bytes("name"), Txn.application_args[1]),

            idx.store(Int(2)),
            While(idx.load() < Txn.application_args.length()).Do(Seq([

                # Get the owner name len
                ownerNameLen.store(Btoi(Substring(
                                Txn.application_args[idx.load()],
                                Int(32),
                                Int(40),
                            ))),

                # Store the name based on owner name len
                name.store(Concat(
                    Bytes("owner_"),
                    itoa(idx.load() - Int(1)),
                    
                )),

                # Validate the length of the owner name
                Assert(
                    And(
                        ownerNameLen.load() > Int(3),
                        ownerNameLen.load() <= Int(20),
                        # 32 + 8 + max 20 len of owner name
                        Len(Txn.application_args[idx.load()]) <= Int(60)
                    )
                ),

                addr.store(Substring(Txn.application_args[idx.load()], Int(0), Int(32))),
                
                # The first owner should be the sender/creator
                If((idx.load() - Int(2)) == Int(0), Seq([
                    Assert(
                        addr.load() == Txn.sender(),
                    ),
                ])),

                # input: Address (32 bytes) | owner name len (8 bytes) | owner name (40 - XX bytes)
                # saved value: Address (32 bytes) | owner name len (8 bytes) | current ptxn count (1 byte) | owner name (40 - XX bytes)
                App.globalPut(name.load(), Concat(
                    addr.load(),
                    Itob(ownerNameLen.load()),
                    intkey(Int(0)),
                    Substring(
                        Txn.application_args[idx.load()],
                        Int(40),
                        Int(40) + ownerNameLen.load()
                    )
                )),

                idx.store(idx.load() + Int(1)),

            ])),

            # Safe the total owners
            App.globalPut(Bytes("owners"), (Txn.application_args.length() - Int(2))),

            Approve(),
        ])
    on_create = getOnCreate()

    def del_safe_cancel():
        is_exists = ScratchVar(TealType.uint64)
        apr = ScratchVar(TealType.uint64)
        rej = ScratchVar(TealType.uint64)
        thres = ScratchVar(TealType.uint64)

        return Seq([
            # only the opted in owner can make a call
            Pop(ownerCheck(Txn.sender())),
            ownerOptin(),

            is_initialized(),

            Assert(
                Global.group_size() == Int(1)
            ),
            assert_common_checks(Txn),           

            is_exists.store(is_key_exists(Bytes("d"))),
            
            Assert(is_exists.load() == Int(1)),

            # Get the number of approvals and rejections
            apr.store(Btoi(blob.read(Bytes("d"), Int(0), Int(8)))),
            rej.store(Btoi(blob.read(Bytes("d"), Int(8), Int(16)))),
            thres.store(App.globalGet(Bytes("thres"))),

            # Deadlock happens when everyone has signed and both apr and rej are below the threshold

            # Delete safe request is approved on either conditions,
            # 1. Rejections hits threshold
            # 2. Deadlock detected
            Assert(Or(
                rej.load() >= thres.load(),
                And(
                    (rej.load() + apr.load()) == App.globalGet(Bytes("owners")),
                    rej.load() < thres.load(),
                    apr.load() < thres.load()
                )
            )),

            App.globalDel(Bytes("d")),
            App.globalDel(Concat(Itob(Int(0)), Bytes("_a"))),

            Approve(),
        ])

    def getOnDelete():
        is_exists = ScratchVar(TealType.uint64)
        apr = ScratchVar(TealType.uint64)
        rej = ScratchVar(TealType.uint64)
        thres = ScratchVar(TealType.uint64)
        return Seq([
            # only the opted in owner can make a call
            Pop(ownerCheck(Txn.sender())),
            ownerOptin(),

            is_initialized(),

            Assert(
                Global.group_size() == Int(1)
            ),
            assert_common_checks(Txn),

            is_exists.store(is_key_exists(Bytes("d"))),
            
            Assert(is_exists.load() == Int(1)),

            # Get the number of approvals and rejections
            apr.store(Btoi(blob.read(Bytes("d"), Int(0), Int(8)))),
            rej.store(Btoi(blob.read(Bytes("d"), Int(8), Int(16)))),

            thres.store(App.globalGet(Bytes("thres"))),

            Assert(apr.load() >= thres.load()),

            Approve(),
        ])

    def rmv_p():
        sender = ScratchVar(TealType.bytes)
        ca_addr = ScratchVar(TealType.bytes)

        initiator = ScratchVar(TealType.bytes)
        return Seq([

            # Atomic txs, 3 txs
            Assert(Global.group_size() == Int(3),),

            # First payment should be undo rekey
            # rekey back to the safe
            Assert(
                And(
                    Gtxn[0].type_enum() == TxnType.Payment,
                    Gtxn[0].amount() == Int(0),
                    Gtxn[0].receiver() == Global.current_application_address(),
                    Gtxn[0].sender() == Global.current_application_address(),
                    Gtxn[0].rekey_to() == Global.current_application_address(),
                    Gtxn[0].close_remainder_to() == Global.zero_address(),
                )
            ),

            # The second transaction should this call
            Assert(
                And(
                    Gtxn[1].type_enum() == TxnType.ApplicationCall,
                    Gtxn[1].application_args[0] == Bytes("rmv_p"),
                    Gtxn[1].application_args.length() == Int(1),
                    Gtxn[1].application_id() == Global.current_application_id(),
                )
            ),
            assert_common_checks(Gtxn[1]),

            # Get the initiator
            initiator.store(blob.read(Bytes("p"), Int(66), Int(98))),

            # The last transaction should be the close remainder to the initiator
            ca_addr.store(blob.read(Bytes("p"), Int(0), Int(32))),

            Assert(
                And(
                    Gtxn[2].type_enum() == TxnType.Payment,
                    Gtxn[2].amount() == Int(0),
                    Gtxn[2].receiver() == ca_addr.load(),
                    Gtxn[2].sender() == ca_addr.load(),
                    Gtxn[2].close_remainder_to() == initiator.load(),
                    Gtxn[2].rekey_to() == Global.zero_address(),
                )
            ),

            # The sender must be the "p" LSIG address
            sender.store(Gtxn[1].sender()),
            Assert(ca_addr.load() == sender.load()),

            # Remove the p from global state
            App.globalDel(Bytes("p")),

            Approve()
        ])


    on_delete = getOnDelete()

    def nop():
        return Seq([Approve()])

    METHOD = Txn.application_args[0]

    router = Cond(
        [METHOD == Bytes("nop"), nop()],
        [METHOD == Bytes("init"), init()],
        [METHOD == Bytes("tx_create"), tx_create()],
        [METHOD == Bytes("tx_exec"), tx_exec()],
        [METHOD == Bytes("tx_remove"), tx_remove()],
        [METHOD == Bytes("tx_vote"), tx_vote()],
        [METHOD == Bytes("del_safe"), del_safe()],
        [METHOD == Bytes("del_safe_cancel"), del_safe_cancel()],
        [METHOD == Bytes("rmv_p"), rmv_p()],
    )

    def getOnUpdate():
        return Seq([
            Reject(),
        ])

    def getOnCloseOut():
        return Seq([
            Reject(),
        ])

    def getOnClearState():
        return Seq([
            Reject(),
        ])

    on_clearstate = getOnClearState()
    on_closeout = getOnCloseOut()
    on_update = getOnUpdate()

    def handleOptin() :
        return Seq([
            # Check the owner
            Pop(ownerCheck(Txn.sender())),

            # Only the safe is being initialized
            is_initialized(),

            App.localPut(Txn.sender(), Bytes("ts"), Global.latest_timestamp()),

            Approve(),
        ])

    on_optin = handleOptin()

    return Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.UpdateApplication, on_update],
        [Txn.on_completion() == OnComplete.DeleteApplication, on_delete],
        [Txn.on_completion() == OnComplete.OptIn, on_optin],
        [Txn.on_completion() == OnComplete.NoOp, router],
        [Txn.on_completion() == OnComplete.CloseOut, on_closeout],
        [Txn.on_completion() == OnComplete.ClearState, on_clearstate],
    )

if __name__ == "__main__":

    optimize_options = OptimizeOptions(scratch_slots=True)
    print(compileTeal(safe_approval(), Mode.Application, version=6, optimize=optimize_options))

    teal = compileTeal(safe_approval(), Mode.Application, version=6, optimize=optimize_options)
    with open("safe.teal", "w") as f:
            f.write(teal)

