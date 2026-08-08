import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://iderhuahuqbffhzjkpfa.supabase.co"
ANON_KEY = "sb_publishable_sgULEDGz9GUr9SHSQekrLQ_9E6gCJAJ"

# Each statement run separately since anon key can only hit REST endpoints
# We'll insert directly into tables using the REST API

headers = {
    "Content-Type": "application/json",
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Prefer": "return=representation"
}

doctors = [
    {
        "name": "Dr. Sarah Jenkins",
        "specialty": "Cardiologist",
        "status": "available",
        "meet_url": "https://meet.google.com/abc-defg-hij",
        "avatar_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"
    },
    {
        "name": "Dr. David Chen",
        "specialty": "Neurologist",
        "status": "available",
        "meet_url": "https://meet.google.com/klm-nopq-rst",
        "avatar_url": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"
    },
    {
        "name": "Dr. Aisha Rahman",
        "specialty": "Pediatrician",
        "status": "busy",
        "meet_url": "https://meet.google.com/uvw-xyz1-234",
        "avatar_url": "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300"
    },
    {
        "name": "Dr. James Wilson",
        "specialty": "Trauma Specialist",
        "status": "offline",
        "meet_url": "https://meet.google.com/567-890a-bcd",
        "avatar_url": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300"
    }
]

print("Checking if doctors table exists by trying to read it...")

try:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/doctors?select=id,name,status&limit=5",
        headers=headers,
        method="GET"
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        print(f"SUCCESS: doctors table exists! Found {len(data)} doctors:")
        for d in data:
            print(f"  - {d.get('name')} [{d.get('status')}]")
        
        if len(data) == 0:
            print("\nTable is empty. Seeding doctors...")
            # Insert doctors
            body = json.dumps(doctors).encode()
            insert_req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/doctors",
                data=body,
                headers={**headers, "Prefer": "return=minimal"},
                method="POST"
            )
            with urllib.request.urlopen(insert_req) as insert_resp:
                print(f"Inserted doctors, status: {insert_resp.status}")
        else:
            print("Doctors already seeded. OK!")

except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"FAILED: HTTP {e.code} - {body}")
    if "relation" in body and "does not exist" in body:
        print("\n=== TABLE DOES NOT EXIST ===")
        print("The 'doctors' table needs to be created in Supabase.")
        print("Please go to: https://supabase.com/dashboard/project/iderhuahuqbffhzjkpfa/sql/new")
        print("And run the SQL from: supabase/migrations/RESQ_COMPLETE_SETUP.sql")
    elif e.code == 404:
        print("REST endpoint not found - check Supabase URL")

print("\nChecking appointments table...")
try:
    req2 = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/appointments?select=id&limit=1",
        headers=headers,
        method="GET"
    )
    with urllib.request.urlopen(req2) as resp2:
        data2 = json.loads(resp2.read())
        print(f"SUCCESS: appointments table exists! Has {len(data2)} records.")
except urllib.error.HTTPError as e2:
    body2 = e2.read().decode()
    print(f"FAILED: HTTP {e2.code} - appointments table: {body2[:200]}")
    if "does not exist" in body2:
        print("appointments table DOES NOT EXIST - SQL migration needed.")
