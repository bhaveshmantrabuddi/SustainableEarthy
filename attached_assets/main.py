import os
from datetime import datetime, timedelta

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from plaid.api import plaid_api
from plaid.api_client import ApiClient
from plaid.configuration import Configuration
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest,
)
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser as User
from plaid.model.products import Products
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions

# Load from environment variables
PLAID_CLIENT_ID = os.environ["PLAID_CLIENT_ID"]
PLAID_SECRET = os.environ["PLAID_SECRET"]
PLAID_ENV = os.environ["PLAID_ENV"]  # should be "sandbox"

# Configure Plaid client
host = "https://sandbox.plaid.com" if PLAID_ENV == "sandbox" else "https://development.plaid.com"

configuration = Configuration(
    host=host,
    api_key={
        'clientId': PLAID_CLIENT_ID,
        'secret': PLAID_SECRET,
    }
)

api_client = ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

# FastAPI App Setup
app = FastAPI()

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

access_token = None
item_id = None

@app.post("/create_link_token")
async def create_link_token():
    try:
        request_body = LinkTokenCreateRequest(
        products=[Products("transactions")],
        client_name="Plaid Test App",
        country_codes=[CountryCode('US')],
        language='en',
        user=User(client_user_id="user-123")
        )
        response = client.link_token_create(request_body)
        link_token = response.to_dict().get("link_token")

        print("DEBUG: Plaid response:", response.to_dict())  # ← ADD THIS

        if not link_token:
            return JSONResponse(status_code=500, content={"error": "No link_token returned by Plaid"})

        return {"link_token": link_token}

    except Exception as e:
        print("Plaid link_token_create error:", e)  # ← ADD THIS
        return JSONResponse(status_code=500, content={"error": str(e)})



# Exchange Public Token
@app.post('/exchange_public_token')
async def exchange_public_token(request: Request):
    global access_token, item_id
    data = await request.json()
    public_token = data.get('public_token')

    exchange_request = ItemPublicTokenExchangeRequest(public_token=public_token)
    exchange_response = client.item_public_token_exchange(exchange_request)

    access_token = exchange_response['access_token']
    item_id = exchange_response['item_id']

    return {"status": "success", "access_token": access_token, "item_id": item_id}

@app.get('/accounts')
async def get_accounts():
    try:
        request = AccountsGetRequest(access_token=access_token)
        accounts_response = client.accounts_get(request)
        return accounts_response.to_dict()
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )

@app.get('/transactions')
async def get_transactions():
    try:


        start_date = (datetime.now() - timedelta(days=30)).date()
        end_date = datetime.now().date()


        request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date,
            end_date=end_date,
            options=TransactionsGetRequestOptions(
                count=100,
                offset=0
            )
        )
        response = client.transactions_get(request)
        return response.to_dict()
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )


@app.get("/")
def home():
    return FileResponse("index.html")

# Serve static files
app.mount("/static", StaticFiles(directory=".", html=True), name="static")