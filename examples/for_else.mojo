def main():
    var found = False
    for item in items:
        if item == target:
            found = True
            break
    else:
        print("not found")  # Only runs if break was never hit
