def main():
    with open("input.txt") as f_in, open("output.txt", "w") as f_out:
        f_out.write(f_in.read())
