def main():
    var x = 42
    var name = "Alice"
    var result: List[Int]
    var hello: Int = 67

    name: String = "Alice"
    values: List[Float64] = []
    comptime Vec3 = List[Float64]
    var position: Vec3 = [0.0, 0.0, 0.0]

    x = y = z = 0        # Assign the same value to multiple names
    a, b = 1, 2          # Destructuring assignment
    (a, b) = (1, 2)      # Equivalent destructuring, not "assign tuple to tuple"
