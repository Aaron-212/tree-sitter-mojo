def main():
    try:
        operation()
    except e:
        handle_error(e)   # Runs if an error occurs
    else:
        on_success()      # Runs only if no error occurred
    finally:
        cleanup()         # Always runs
