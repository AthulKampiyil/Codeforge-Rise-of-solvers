try:
    from fastapi.security import HTTPBearer, HTTPAuthCredentials
    print("HTTPAuthCredentials exists")
except ImportError as e:
    print(f"Import error: {e}")
    from fastapi import security
    print("Available in security module:")
    print([x for x in dir(security) if 'Auth' in x or 'HTTP' in x or 'Credential' in x])
