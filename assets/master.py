# Contract Account

# Add directory to path so that algobpy can be imported
import sys
sys.path.insert(0,'.')

from pyteal import *

def master_approval():
    '''
    Master Contract
    '''

    @Subroutine(TealType.none)
    def adminCheck():
        return Seq([
            Assert(Or(
                Txn.sender() == Global.creator_address(),
                Txn.sender() == App.globalGet(Bytes("admin"))
            )),

            # Common checks
            Assert(And(
                Global.group_size() == Int(1),
                Txn.rekey_to() == Global.zero_address(),
                Txn.close_remainder_to() == Global.zero_address(),
                Txn.asset_close_to() == Global.zero_address()
            ))
        ])

    def signatureCheck():
        valid = ScratchVar(TealType.uint64)

        return Seq([

            Assert(
                And(
                    Txn.accounts.length() == Int(1),
                    Txn.application_args.length() == Int(2),
                    Txn.rekey_to() == Global.zero_address(),
                )
            ),

            valid.store(Ed25519Verify(
                # Data -> LSIG/Contract Account address
                Txn.accounts[1],

                # Signature
                Txn.application_args[1],

                # Pub Key
                App.globalGet(Bytes("pk"))
            )),

            Assert(valid.load() == Int(1)),

            Approve()
        ])
    def getOnCreate():
        fee = ScratchVar(TealType.uint64)
        min = ScratchVar(TealType.uint64)

        return Seq([

            # WIll have 1 account and 3 args
            Assert(And(
                Txn.accounts.length() == Int(1), # 1 account
                Txn.application_args.length() == Int(3), # 2 fees, 1 public key
            )),

            fee.store(Btoi(Txn.application_args[0])),
            min.store(Btoi(Txn.application_args[1])),

            Assert(
                And(
                    fee.load() > Int(0),
                    min.load() > Int(0),
                )
            ),

            # public key
            App.globalPut(Bytes("pk"), Txn.application_args[2]),

            App.globalPut(Bytes("addr"), Txn.accounts[1]),
            App.globalPut(Bytes("fee"), fee.load()),
            App.globalPut(Bytes("min"), min.load()),

            # by default, the admin is the creator
            App.globalPut(Bytes("admin"), Txn.sender()),

            Approve(),
        ])   

    on_create = getOnCreate()
    
    on_delete = Seq([Reject()])

    def treasuryUpdate():
        return Seq([
            adminCheck(),

            Assert(
                Txn.accounts.length() == Int(1) # The new treasury address
            ),

            App.globalPut(Bytes("addr"), Txn.accounts[1]),

            Approve(),
        ])

    # Updating the network fee (when "init" safe being called)
    def feeUpdate():
        fee = ScratchVar(TealType.uint64)

        return Seq([
            adminCheck(),

            # Second app arg is the new network fee (in microalgos)
            Assert(
                Txn.application_args.length() == Int(2), 
            ),

            fee.store(Btoi(Txn.application_args[1])),

            # Must be greater than 0
            Assert(fee.load() > Int(0)),

            App.globalPut(Bytes("fee"), fee.load()),

            Approve(),
        ])

    # Updating the public key
    def pkUpdate():
        return Seq([
            adminCheck(),

            # Second app arg is the new public key
            Assert(
                Txn.application_args.length() == Int(2), 
            ),

            App.globalPut(Bytes("pk"), Txn.application_args[1]),

            Approve(),
        ])

    # Updating the minimum topup
    def minUpdate():
        min = ScratchVar(TealType.uint64)
        return Seq([
            adminCheck(),

            # Second app arg is the new minimum topup (in microalgos)
            Assert(
                Txn.application_args.length() == Int(2), 
            ),

            min.store(Btoi(Txn.application_args[1])),

            # Must be greater than 0
            Assert(min.load() > Int(0)),

            App.globalPut(Bytes("min"), min.load()),

            Approve(),
        ])

    # Updating the admin
    def adminUpdate():
        return Seq([
            adminCheck(),

            Assert(
                Txn.accounts.length() == Int(1), 
            ),

            App.globalPut(Bytes("admin"), Txn.accounts[1]),

            Approve(),
        ])

    def nop():
        return Seq([Approve()])

    METHOD = Txn.application_args[0]

    router = Cond(
        [METHOD == Bytes("nop"), nop()],
        [METHOD == Bytes("treasuryUpdate"), treasuryUpdate()],
        [METHOD == Bytes("feeUpdate"), feeUpdate()],
        [METHOD == Bytes("minUpdate"), minUpdate()],
        [METHOD == Bytes("pkUpdate"), pkUpdate()],
        [METHOD == Bytes("adminUpdate"), adminUpdate()],
        [METHOD == Bytes("signatureCheck"), signatureCheck()],
    )

    def getOnUpdate():
        return Seq([
            adminCheck(),

            Approve()
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

    on_optin = Seq( [
        Reject()
    ])

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
    print(compileTeal(master_approval(), Mode.Application, version = 6, optimize=optimize_options))

    teal = compileTeal(master_approval(), Mode.Application, version = 6, optimize=optimize_options)
    with open("master.teal", "w") as f:
            f.write(teal)