import os
import django
import random
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Now we can import Django models
from alarms.models import Alarm, Tenant, AlarmUpdate
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

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
    'PRD Nationwide Bundaberg',
    'RE/MAX Gold Coast',
    'Raine & Horne Brisbane',
    'Professionals Paradise Point',
    'Elders Real Estate Toowoomba',
    'Richardson & Wrench',
    'Coronis Real Estate',
    'Metro City Realty',
    'Rental Express',
    'Image Property',
    'Living Here'
]

# Queensland Suburbs with Postcodes
qld_locations = [
    ('Brisbane City', '4000', -27.4698, 153.0251),
    ('South Brisbane', '4101', -27.4809, 153.0172),
    ('West End', '4101', -27.4809, 153.0172),
    ('Fortitude Valley', '4006', -27.4570, 153.0361),
    ('New Farm', '4005', -27.4676, 153.0528),
    ('Surfers Paradise', '4217', -28.0016, 153.4307),
    ('Broadbeach', '4218', -28.0295, 153.4343),
    ('Robina', '4226', -28.0745, 153.3876),
    ('Burleigh Heads', '4220', -28.0927, 153.4482),
    ('Noosa Heads', '4567', -26.3981, 153.0893),
    ('Maroochydore', '4558', -26.6517, 153.0918),
    ('Caloundra', '4551', -26.7993, 153.1333),
    ('Toowoomba', '4350', -27.5598, 151.9507),
    ('Townsville', '4810', -19.2590, 146.8169),
    ('Cairns', '4870', -16.9186, 145.7781),
    ('Chermside', '4032', -27.3861, 153.0344),
    ('Indooroopilly', '4068', -27.4986, 152.9736),
    ('Carindale', '4152', -27.5046, 153.1003),
    ('Mount Gravatt', '4122', -27.5377, 153.0814),
    ('Sunnybank', '4109', -27.5744, 153.0546),
    ('Cleveland', '4163', -27.5338, 153.2682),
    ('Redcliffe', '4020', -27.2292, 153.1103),
    ('North Lakes', '4509', -27.2372, 153.0137),
    ('Springfield Lakes', '4300', -27.6866, 152.9070),
    ('Ipswich', '4305', -27.6167, 152.7667)
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
    'River Terrace',
    'Pacific Boulevard',
    'Mountain View Drive',
    'Sunset Avenue',
    'Palm Street',
    'Beach Road',
    'Railway Parade',
    'Station Street',
    'Victoria Road',
    'Albert Street',
    'William Street',
    'Park Road',
    'Main Street',
    'High Street',
    'Bay Street',
    'Valley Way'
]

# Common Australian Names
first_names = [
    'Jack', 'Oliver', 'William', 'Noah', 'James',
    'Charlotte', 'Olivia', 'Ava', 'Mia', 'Sophie',
    'Thomas', 'Lucas', 'Henry', 'Oscar', 'Charlie',
    'Amelia', 'Isla', 'Grace', 'Ruby', 'Emma',
    'Ethan', 'Mason', 'Alexander', 'Max', 'Samuel',
    'Chloe', 'Lucy', 'Emily', 'Hannah', 'Lily',
    'Liam', 'Harrison', 'Joshua', 'Hudson', 'Cooper',
    'Isabella', 'Sophia', 'Zoe', 'Evie', 'Scarlett'
]

last_names = [
    'Smith', 'Jones', 'Williams', 'Brown', 'Wilson',
    'Taylor', 'Anderson', 'Thompson', 'Walker', 'White',
    'Harris', 'Martin', 'Davies', 'Robertson', 'Murphy',
    'Clarke', 'Johnston', 'Hughes', 'Stewart', 'Campbell',
    'Young', 'Mitchell', 'Watson', 'Lee', 'King',
    'Wright', 'Scott', 'Green', 'Baker', 'Adams',
    'Hall', 'Allen', 'Clarke', 'Hill', 'Carter',
    'Cooper', 'Richards', 'Turner', 'Phillips', 'Morgan'
]

# Common smoke alarm issues and descriptions
smoke_alarm_issues = [
    "Alarm chirping intermittently every {minutes} minutes",
    "Smoke alarm going off randomly without smoke present",
    "All interconnected alarms activating simultaneously",
    "Low battery warning beep occurring since {days} days",
    "Alarm not responding to test button",
    "Alarm making unusual buzzing sound",
    "Green light not showing on hardwired alarm",
    "Alarm appears to be more sensitive than usual",
    "Alarm triggered by cooking/shower steam",
    "Red light flashing {times} times per minute"
]

smoke_alarm_locations = [
    "in the hallway",
    "in the master bedroom",
    "near the kitchen",
    "in the living room",
    "upstairs landing",
    "downstairs hallway",
    "in children's bedroom",
    "outside bathroom",
    "in the study",
    "near stairwell"
]

additional_details = [
    "Tenant reports this has been ongoing for {duration}.",
    "Issue seems worse at night.",
    "Problem started after recent power outage.",
    "Attempted battery replacement but issue persists.",
    "Multiple units in the property showing same behavior.",
    "Issue occurs more frequently in humid conditions.",
    "Previous maintenance attempted but unsuccessful.",
    "Tenant concerned about safety implications.",
    "Property manager requesting urgent attention.",
    "Similar issue reported in neighboring unit."
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

def generate_alarm_notes():
    # Generate a detailed note about the smoke alarm issue
    issue = random.choice(smoke_alarm_issues).format(
        minutes=random.randint(2, 30),
        days=random.randint(1, 7),
        times=random.randint(2, 6)
    )
    location = random.choice(smoke_alarm_locations)
    detail = random.choice(additional_details).format(
        duration=f"{random.randint(1, 14)} days"
    )
    
    # Combine the components into a detailed note
    note = f"{issue} {location}. {detail}"
    
    # 30% chance to add a second issue
    if random.random() < 0.3:
        second_issue = random.choice(smoke_alarm_issues).format(
            minutes=random.randint(2, 30),
            days=random.randint(1, 7),
            times=random.randint(2, 6)
        )
        second_location = random.choice(smoke_alarm_locations)
        note += f"\n\nAdditional issue: {second_issue} {second_location}."
    
    return note

def create_alarm_updates(alarm, initial_note, created_by=None):
    """Create a series of updates for an alarm to simulate real-world progression"""
    
    # Initial note when alarm is created
    AlarmUpdate.objects.create(
        alarm=alarm,
        update_type='customer_contact',
        note=f"Initial contact: {initial_note}",
        created_by=created_by
    )

    # Add some random progression updates based on the alarm's stage
    if alarm.stage == 'completed':
        # For completed alarms, add a full history
        AlarmUpdate.objects.create(
            alarm=alarm,
            update_type='call_attempt',
            note="Called customer to schedule inspection.",
            created_by=created_by,
            created_at=alarm.created_at + timedelta(hours=random.randint(2, 24))
        )
        
        AlarmUpdate.objects.create(
            alarm=alarm,
            update_type='customer_contact',
            note="Customer confirmed appointment for inspection.",
            created_by=created_by,
            created_at=alarm.created_at + timedelta(hours=random.randint(25, 48))
        )
        
        AlarmUpdate.objects.create(
            alarm=alarm,
            update_type='status_change',
            note="Job completed. All alarms tested and functioning correctly.",
            created_by=created_by,
            created_at=alarm.created_at + timedelta(days=random.randint(3, 7))
        )

    elif alarm.stage == 'quote_sent':
        # For quote sent stage
        AlarmUpdate.objects.create(
            alarm=alarm,
            update_type='call_attempt',
            note="Attempted to contact customer for inspection details.",
            created_by=created_by,
            created_at=alarm.created_at + timedelta(hours=random.randint(2, 24))
        )
        
        AlarmUpdate.objects.create(
            alarm=alarm,
            update_type='status_change',
            note="Quote sent to customer via email.",
            created_by=created_by,
            created_at=alarm.created_at + timedelta(days=random.randint(1, 3))
        )

    elif alarm.stage == 'to_be_called':
        # For to be called stage
        if random.random() < 0.7:  # 70% chance of having attempted calls
            attempts = random.randint(1, 3)
            for i in range(attempts):
                AlarmUpdate.objects.create(
                    alarm=alarm,
                    update_type='call_attempt',
                    note=f"Attempt #{i+1} to contact customer - No answer",
                    created_by=created_by,
                    created_at=alarm.created_at + timedelta(hours=random.randint(i*24, (i+1)*24))
                )

    # Random chance for additional general notes
    if random.random() < 0.3:  # 30% chance
        general_notes = [
            "Customer requested afternoon appointment only",
            "Access instructions: Key safe code provided",
            "Property has dogs - need to coordinate with tenant",
            "Customer prefers text message communication",
            "Special tools needed for high ceiling alarms"
        ]
        AlarmUpdate.objects.create(
            alarm=alarm,
            update_type='general_note',
            note=random.choice(general_notes),
            created_by=created_by,
            created_at=alarm.created_at + timedelta(hours=random.randint(1, 48))
        )

def main():
    # Delete existing data
    print("Deleting existing data...")
    Alarm.objects.all().delete()

    # Create or get a test user for the updates
    test_user, _ = User.objects.get_or_create(
        username='test_user',
        email='test@example.com'
    )

    print("Generating 200 alarms with tenants and updates...")
    # Generate 200 alarms
    for i in range(200):
        # Random date within last 90 days for more variety
        date = timezone.now().date() - timedelta(days=random.randint(0, 90))
        
        # Random location
        suburb, postal_code, lat, lon = random.choice(qld_locations)
        
        # Determine if rental or private
        is_rental = random.choice([True, False])
        is_private = not is_rental

        # Generate notes before creating the alarm
        initial_notes = generate_alarm_notes()
        
        # Create alarm
        alarm = Alarm.objects.create(
            date=date,
            is_rental=is_rental,
            is_private=is_private,
            realestate_name=random.choice(real_estate_agencies) if is_rental else None,
            street_number=str(random.randint(1, 500)),
            street_name=random.choice(street_names),
            suburb=suburb,
            city='Brisbane' if random.random() < 0.7 else random.choice(['Gold Coast', 'Sunshine Coast', 'Toowoomba', 'Ipswich']),
            state='Queensland',
            postal_code=postal_code,
            country='Australia',
            latitude=lat + random.uniform(-0.002, 0.002),  # Add small random offset
            longitude=lon + random.uniform(-0.002, 0.002),  # Add small random offset
            who_contacted=generate_name(),
            contact_method=random.choice(['email', 'phone', 'work_order']),
            work_order_number=f"WO{random.randint(100000, 999999)}" if random.choice([True, False]) else '',
            sound_type=random.choice(['full_alarm', 'chirping_alarm']),
            install_date=date - timedelta(days=random.randint(365, 3650)) if random.choice([True, False]) else None,
            brand=random.choice(['red', 'firepro', 'emerald', 'cavius', 'other']),
            hardwire_alarm=random.randint(0, 8) if random.choice([True, False]) else None,
            wireless_alarm=random.randint(0, 8) if random.choice([True, False]) else None,
            is_wall_control=random.choice([True, False]),
            completed=random.choice([True, False]),
            stage=random.choice(['to_be_booked', 'quote_sent', 'completed', 'to_be_called']),
            notes=initial_notes
        )

        # Create updates for the alarm
        create_alarm_updates(alarm, initial_notes, test_user)

        # Add tenants
        for _ in range(random.randint(1, 4)):
            Tenant.objects.create(
                alarm=alarm,
                name=generate_name(),
                phone=generate_phone()
            )
        
        if (i + 1) % 20 == 0:  # Print progress every 20 records
            print(f"Created alarm {i+1}/200 at {alarm.street_number} {alarm.street_name}, {alarm.suburb}")

    print("\nTest data generation complete!")

if __name__ == "__main__":
    main() 