from std.math import sqrt

struct Point:
    var x: Int
    var y: Int

    def __init__(out self, x: Int, y: Int):
        self.x = x
        self.y = y

    def distance(self) -> Float64:
        return sqrt(
            Float64(self.x * self.x + self.y * self.y)
        )

def main():
    p = Point(3, 4)
    print(p.distance()) # 5.0
