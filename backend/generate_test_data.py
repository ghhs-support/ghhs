import os
import django
import random
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Now we can import Django models
from alarms.models import Alarm, Tenant
from django.utils import timezone

# Queensland Real Estate Agencies
real_estate_agencies = [
    'Ray White Brisbane',
    'LJ Hooker Gold Coast',
    'Place Estate Agents',
    'McGrath Caloundra',
    'Belle Property Toowoomba',
    'Harcourts Townsville',
    'First National Cairns',
    'REMAX Rockhampton',
    'Century 21 Mackay',
    'PRD Nationwide Bundaberg'
]

# Queensland Suburbs with Postcodes
qld_locations = [
    ('Brisbane City', '4000'),
    ('South Brisbane', '4101'),
    ('West End', '4101'),
    ('Fortitude Valley', '4006'),
    ('New Farm', '4005'),
    ('Surfers Paradise', '4217'),
    ('Broadbeach', '4218'),
    ('Robina', '4226'),
    ('Burleigh Heads', '4220'),
    ('Noosa Heads', '4567'),
    ('Maroochydore', '4558'),
    ('Caloundra', '4551'),
    ('Toowoomba', '4350'),
    ('Townsville', '4810'),
    ('Cairns', '4870')
]

# Common Queensland Street Names
street_names = [
    'Queen Street',
    'Eagle Street',
    'Ann Street',
    'Brunswick Street',
    'James Street',
    'George Street',
    'Adelaide Street',
    'Elizabeth Street',
    'Margaret Street',
    'Edward Street',
    'Boundary Street',
    'Creek Street',
    'Marine Parade',
    'The Esplanade',
    'River Terrace'
]

# Common Australian Names
first_names = [
    'Jack', 'Oliver', 'William', 'Noah', 'James',
    'Charlotte', 'Olivia', 'Ava', 'Mia', 'Sophie',
    'Thomas', 'Lucas', 'Henry', 'Oscar', 'Charlie',
    'Amelia', 'Isla', 'Grace', 'Ruby', 'Emma'
]

last_names = [
    'Smith', 'Jones', 'Williams', 'Brown', 'Wilson',
    'Taylor', 'Anderson', 'Thompson', 'Walker', 'White',
    'Harris', 'Martin', 'Davies', 'Robertson', 'Murphy',
    'Clarke', 'Johnston', 'Hughes', 'Stewart', 'Campbell'
]

def generate_phone():
    # Generate Queensland mobile or landline numbers
    if random.choice([True, False]):
        # Mobile number (04XX XXX XXX)
        return f"04{random.randint(10,99)} {random.randint(100,999)} {random.randint(100,999)}"
    else:
        # Brisbane landline (07 XXXX XXXX)
        return f"07 {random.randint(3000,3999)} {random.randint(1000,9999)}"

def generate_name():
    return f"{random.choice(first_names)} {random.choice(last_names)}"

def main():
    # Delete existing data
    print("Deleting existing data...")
    Alarm.objects.all().delete()

    print("Generating 50 alarms with tenants...")
    # Generate 50 alarms
    for i in range(50):
        # Random date within last 30 days
        date = timezone.now().date() - timedelta(days=random.randint(0, 30))
        
        # Random location
        suburb, postal_code = random.choice(qld_locations)
        
        # Determine if rental or private
        is_rental = random.choice([True, False])
        is_private = not is_rental
        
        # Create alarm
        alarm = Alarm.objects.create(
            date=date,
            is_rental=is_rental,
            is_private=is_private,
            realestate_name=random.choice(real_estate_agencies) if is_rental else None,
            street_number=str(random.randint(1, 300)),
            street_name=random.choice(street_names),
            suburb=suburb,
            city='Brisbane',  # Most will be Brisbane
            state='Queensland',
            postal_code=postal_code,
            country='Australia',
            who_contacted=generate_name(),
            contact_method=random.choice(['email', 'phone', 'work_order']),
            work_order_number=f"WO{random.randint(100000, 999999)}" if random.choice([True, False]) else '',
            sound_type=random.choice(['full_alarm', 'chirping_alarm']),
            install_date=date - timedelta(days=random.randint(365, 3650)) if random.choice([True, False]) else None,
            brand=random.choice(['red', 'firepro', 'emerald', 'cavius', 'other']),
            hardwire_alarm=random.randint(0, 5) if random.choice([True, False]) else None,
            wireless_alarm=random.randint(0, 5) if random.choice([True, False]) else None,
            is_wall_control=random.choice([True, False]),
            completed=random.choice([True, False]),
            stage=random.choice(['to_be_booked', 'quote_sent', 'completed', 'to_be_called'])
        )

        # Add 1-3 tenants
        for _ in range(random.randint(1, 3)):
            Tenant.objects.create(
                alarm=alarm,
                name=generate_name(),
                phone=generate_phone()
            )
        
        print(f"Created alarm {i+1}/50 at {alarm.street_number} {alarm.street_name}, {alarm.suburb}")

    print("\nTest data generation complete!")

if __name__ == "__main__":
    main() 