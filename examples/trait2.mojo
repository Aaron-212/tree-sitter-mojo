trait Boxable:
    comptime Associated: Writable & Copyable & ImplicitlyDestructible

    def unbox(self) -> Self.Associated:
        ...

@fieldwise_init
struct ConcreteBox(Boxable):
    comptime Associated = String
    var value: Self.Associated

    def unbox(self) -> Self.Associated:
        return self.value.copy()

def main():
    var box = ConcreteBox(value="Hello")
    var unboxed = box.unbox()  # Known to be Copyable
    print(unboxed)             # Known to be Writable
    _ = unboxed^               # Known to be ImplicitlyDestructible
