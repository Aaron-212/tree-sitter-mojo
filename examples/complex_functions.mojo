def clamp[T: Comparable & ImplicitlyCopyable](
    val: T, lo: T, hi: T,
) -> T:
    if val < lo:
        return lo
    if val > hi:
        return hi
    return val

def fetch() raises NetworkError -> String:
    raise NetworkError("HTCPCP", 418)
