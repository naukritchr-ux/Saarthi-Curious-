from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

CLIENT_SECRET_FILE = (
    "client_secret_554005559592-l70hatog0h1fja45in0bu6hg1e59ssbc.apps.googleusercontent.com.json"
)

flow = InstalledAppFlow.from_client_secrets_file(
    CLIENT_SECRET_FILE,
    SCOPES
)

credentials = flow.run_local_server(port=0)

print("\nREFRESH TOKEN:")
print(credentials.refresh_token)

print("\nACCESS TOKEN:")
print(credentials.token)