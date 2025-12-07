
import streamlit as st
import requests

st.title("GenAI Credit Card Assistant Demo")

backend = st.text_input("Backend URL", "http://localhost:8000")

msg = st.text_input("Ask something:")

if st.button("Send"):
    r = requests.post(f"{backend}/chat", json={"user_id": "demo", "text": msg})
    st.json(r.json())
