from std.reflection import get_type_name

def inferred_type[T: Writable, //](value: T):
    print(t"Value is {value}. Type is {get_type_name[T]()}.")

def main():
    inferred_type(5)       # Value is 5. Type is Int.
    inferred_type("Hello") # Value is Hello. Type is String.
    inferred_type[T=Int](5)
