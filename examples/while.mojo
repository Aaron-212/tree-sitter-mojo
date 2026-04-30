def main():
    while True:
        var item = get_next()
        if item is None:
            break       # Exit loop if no more items
        if not is_valid(item):
            continue    # Skip invalid items
        process(item)  # Only runs for valid items
