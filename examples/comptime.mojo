from std.sys import size_of

comptime if size_of[Int]() == 8:
    print("64-bit")
else:
    print("Probably 32-bit")

comptime for i in range(3):
    print(i)   # Compiled as: print(0); print(1); print(2)
