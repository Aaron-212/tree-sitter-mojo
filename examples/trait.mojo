trait RequiredMethods:
    def required_method(self):
        ...

    @staticmethod
    def required_static_method():
        ...

@fieldwise_init
struct SampleStruct(RequiredMethods):
    def required_method(self):
        print("Required method")

    @staticmethod
    def required_static_method():
        print("Required static method")

def main():
    var s = SampleStruct()
    s.required_method()        # Required method
    SampleStruct.required_static_method() # Required static method
