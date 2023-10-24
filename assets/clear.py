from pyteal import *

def clear_state_program():
    return Return(Int(0))

optimize_options = OptimizeOptions(scratch_slots=True)
if __name__ == "__main__":
    print(compileTeal(clear_state_program(), Mode.Application, version = 6, optimize=optimize_options))

    teal = compileTeal(clear_state_program(), Mode.Application, version = 6, optimize=optimize_options)
    with open("clear.teal", "w") as f:
            f.write(teal)