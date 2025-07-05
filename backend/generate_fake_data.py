#!/usr/bin/env python
"""
Script to generate fake QLD data for testing the maintenance system.
Run this script from the backend directory: python generate_fake_data.py
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_DOWN

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from properties.models import Agency, PrivateOwner, Property, Tenant, PropertyManager
from maintenance.models import IssueType, BeepingAlarm, BeepingAlarmUpdate

def clear_existing_data():
    """Clear all existing data before creating new data"""
    print("🧹 Clearing existing data...")
    
    # Clear in reverse order of dependencies
    BeepingAlarmUpdate.objects.all().delete()
    print("   - Cleared BeepingAlarmUpdate records")
    
    BeepingAlarm.objects.all().delete()
    print("   - Cleared BeepingAlarm records")
    
    IssueType.objects.all().delete()
    print("   - Cleared IssueType records")
    
    Property.objects.all().delete()
    print("   - Cleared Property records")
    
    Tenant.objects.all().delete()
    print("   - Cleared Tenant records")
    
    PropertyManager.objects.all().delete()
    print("   - Cleared PropertyManager records")
    
    PrivateOwner.objects.all().delete()
    print("   - Cleared PrivateOwner records")
    
    Agency.objects.all().delete()
    print("   - Cleared Agency records")
    
    print("✅ All existing data cleared!")

def create_fake_agencies():
    """Create fake QLD agencies"""
    agencies_data = [
        {
            'name': 'Brisbane Property Management',
            'email': 'info@brisbanepm.com',
            'phone': '07 3123 4567',
            'unit_number': 'Suite 101',
            'street_number': '123',
            'street_name': 'Queen Street',
            'suburb': 'Brisbane',
            'state': 'QLD',
            'postcode': '4000',
            'country': 'Australia',
            'longitude': 153.0251,
            'latitude': -27.4698,
        },
        {
            'name': 'Gold Coast Real Estate',
            'email': 'contact@goldcoastreal.com',
            'phone': '07 5567 8901',
            'unit_number': 'Level 3',
            'street_number': '456',
            'street_name': 'Surfers Paradise Boulevard',
            'suburb': 'Surfers Paradise',
            'state': 'QLD',
            'postcode': '4217',
            'country': 'Australia',
            'longitude': 153.4300,
            'latitude': -28.0026,
        },
        {
            'name': 'Sunshine Coast Property Group',
            'email': 'hello@sunshinecoastproperty.com',
            'phone': '07 5432 1098',
            'unit_number': 'Unit 5',
            'street_number': '789',
            'street_name': 'Mooloolaba Esplanade',
            'suburb': 'Mooloolaba',
            'state': 'QLD',
            'postcode': '4557',
            'country': 'Australia',
            'longitude': 153.1200,
            'latitude': -26.6800,
        },
        {
            'name': 'Townsville Property Services',
            'email': 'info@townsvilleproperty.com',
            'phone': '07 4721 3456',
            'unit_number': 'Suite 2',
            'street_number': '321',
            'street_name': 'Flinders Street',
            'suburb': 'Townsville',
            'state': 'QLD',
            'postcode': '4810',
            'country': 'Australia',
            'longitude': 146.8160,
            'latitude': -19.2590,
        },
        {
            'name': 'Cairns Property Management',
            'email': 'contact@cairnsproperty.com',
            'phone': '07 4031 2345',
            'unit_number': 'Level 1',
            'street_number': '654',
            'street_name': 'Shield Street',
            'suburb': 'Cairns',
            'state': 'QLD',
            'postcode': '4870',
            'country': 'Australia',
            'longitude': 145.7700,
            'latitude': -16.9200,
        },
    ]
    
    agencies = []
    for agency_data in agencies_data:
        agency = Agency.objects.create(**agency_data)
        print(f"Created agency: {agency.name}")
        agencies.append(agency)
    
    return agencies

def create_fake_private_owners():
    """Create fake QLD private owners"""
    owners_data = [
        {
            'first_name': 'Robert',
            'last_name': 'Johnson',
            'email': 'robert.johnson@email.com',
            'phone': '0412 345 678',
            'notes': 'Prefers morning appointments',
        },
        {
            'first_name': 'Jennifer',
            'last_name': 'Smith',
            'email': 'jennifer.smith@email.com',
            'phone': '0423 456 789',
            'notes': 'Contact via email preferred',
        },
        {
            'first_name': 'Michael',
            'last_name': 'Brown',
            'email': 'michael.brown@email.com',
            'phone': '0434 567 890',
            'notes': 'Available after 6 PM',
        },
        {
            'first_name': 'Amanda',
            'last_name': 'Davis',
            'email': 'amanda.davis@email.com',
            'phone': '0445 678 901',
            'notes': 'Weekend appointments only',
        },
        {
            'first_name': 'David',
            'last_name': 'Wilson',
            'email': 'david.wilson@email.com',
            'phone': '0456 789 012',
            'notes': 'Emergency contact only',
        },
        {
            'first_name': 'Sarah',
            'last_name': 'Taylor',
            'email': 'sarah.taylor@email.com',
            'phone': '0467 890 123',
            'notes': 'Prefers SMS notifications',
        },
        {
            'first_name': 'James',
            'last_name': 'Anderson',
            'email': 'james.anderson@email.com',
            'phone': '0478 901 234',
            'notes': 'Contact through property manager',
        },
        {
            'first_name': 'Emma',
            'last_name': 'Thomas',
            'email': 'emma.thomas@email.com',
            'phone': '0489 012 345',
            'notes': 'Available weekdays only',
        },
    ]
    
    owners = []
    for owner_data in owners_data:
        owner = PrivateOwner.objects.create(**owner_data)
        print(f"Created private owner: {owner}")
        owners.append(owner)
    
    return owners

def create_fake_properties(agencies, private_owners):
    """Create fake QLD properties - either agency OR private owner, never both"""
    qld_suburbs = [
        # Brisbane
        ('Brisbane', '4000', 153.0251, -27.4698),
        ('Fortitude Valley', '4006', 153.0350, -27.4560),
        ('New Farm', '4005', 153.0450, -27.4700),
        ('West End', '4101', 153.0150, -27.4800),
        ('Paddington', '4064', 153.0050, -27.4600),
        ('Bulimba', '4171', 153.0550, -27.4500),
        ('Hamilton', '4007', 153.0750, -27.4400),
        ('Ascot', '4007', 153.0650, -27.4300),
        
        # Gold Coast
        ('Surfers Paradise', '4217', 153.4300, -28.0026),
        ('Broadbeach', '4218', 153.4200, -28.0300),
        ('Mermaid Beach', '4218', 153.4100, -28.0400),
        ('Burleigh Heads', '4220', 153.4000, -28.1000),
        ('Coolangatta', '4225', 153.3900, -28.1700),
        ('Southport', '4215', 153.4400, -27.9700),
        ('Nerang', '4211', 153.3500, -27.9900),
        
        # Sunshine Coast
        ('Mooloolaba', '4557', 153.1200, -26.6800),
        ('Maroochydore', '4558', 153.1000, -26.6600),
        ('Caloundra', '4551', 153.1300, -26.8000),
        ('Noosa Heads', '4567', 153.0900, -26.4000),
        ('Buderim', '4556', 153.0500, -26.6800),
        
        # Townsville
        ('Townsville', '4810', 146.8160, -19.2590),
        ('North Ward', '4810', 146.8200, -19.2500),
        ('South Townsville', '4810', 146.8100, -19.2700),
        ('Magnetic Island', '4819', 146.8500, -19.1700),
        
        # Cairns
        ('Cairns', '4870', 145.7700, -16.9200),
        ('Cairns North', '4870', 145.7800, -16.9100),
        ('Edge Hill', '4870', 145.7600, -16.9300),
        ('Parramatta Park', '4870', 145.7500, -16.9400),
    ]
    
    properties = []
    for i, (suburb, postcode, lon, lat) in enumerate(qld_suburbs):
        # Create multiple properties per suburb
        for j in range(3):
            # Randomly decide property type: agency OR private owner (never both)
            property_type = random.choice(['agency', 'private'])
            
            if property_type == 'agency':
                agency = random.choice(agencies)
                private_owner = None
            else:  # private
                agency = None
                private_owner = random.choice(private_owners)
            
            # Calculate coordinates with proper decimal precision
            # max_digits=9, decimal_places=6 means total digits <= 9, up to 6 decimal places
            # For coordinates like 153.025123, we have 9 digits total (3 before + 6 after)
            lon_offset = random.uniform(-0.0001, 0.0001)  # Much smaller offset
            lat_offset = random.uniform(-0.0001, 0.0001)  # Much smaller offset
            final_lon = lon + lon_offset
            final_lat = lat + lat_offset
            
            # Ensure we don't exceed the field constraints
            # max_digits=9, decimal_places=6 means max value is 999.999999
            final_lon = round(final_lon, 6)
            final_lat = round(final_lat, 6)
            
            # Additional validation to ensure we don't exceed max_digits
            if abs(final_lon) >= 1000 or abs(final_lat) >= 1000:
                # If we exceed, use the original coordinates
                final_lon = round(lon, 6)
                final_lat = round(lat, 6)

            # Use Decimal and quantize to 6 decimal places
            final_lon = Decimal(str(final_lon)).quantize(Decimal('0.000001'), rounding=ROUND_DOWN)
            final_lat = Decimal(str(final_lat)).quantize(Decimal('0.000001'), rounding=ROUND_DOWN)

            property_data = {
                'agency': agency,
                'private_owner': private_owner,
                'unit_number': str(random.randint(1, 50)) if random.choice([True, False]) else None,
                'street_number': str(random.randint(1, 999)),
                'street_name': random.choice([
                    'Main Street', 'Ocean Drive', 'Beach Road', 'Park Avenue', 
                    'Sunset Boulevard', 'Palm Street', 'Coral Way', 'Tropical Drive',
                    'Paradise Street', 'Coastal Road', 'Harbour View', 'Mountain Road'
                ]),
                'suburb': suburb,
                'state': 'QLD',
                'postcode': postcode,
                'country': 'Australia',
                'longitude': final_lon,
                'latitude': final_lat,
            }
            
            property_obj = Property.objects.create(**property_data)
            print(f"Created property: {property_obj.street_number} {property_obj.street_name}, {property_obj.suburb}")
            properties.append(property_obj)
    
    return properties

def create_fake_tenants():
    """Create fake QLD tenants"""
    tenants_data = [
        {'first_name': 'Alex', 'last_name': 'Thompson', 'email': 'alex.thompson@email.com', 'phone': '0411 111 111'},
        {'first_name': 'Jordan', 'last_name': 'Lee', 'email': 'jordan.lee@email.com', 'phone': '0412 222 222'},
        {'first_name': 'Casey', 'last_name': 'Miller', 'email': 'casey.miller@email.com', 'phone': '0413 333 333'},
        {'first_name': 'Riley', 'last_name': 'Davis', 'email': 'riley.davis@email.com', 'phone': '0414 444 444'},
        {'first_name': 'Taylor', 'last_name': 'Garcia', 'email': 'taylor.garcia@email.com', 'phone': '0415 555 555'},
        {'first_name': 'Morgan', 'last_name': 'Rodriguez', 'email': 'morgan.rodriguez@email.com', 'phone': '0416 666 666'},
        {'first_name': 'Avery', 'last_name': 'Wilson', 'email': 'avery.wilson@email.com', 'phone': '0417 777 777'},
        {'first_name': 'Quinn', 'last_name': 'Martinez', 'email': 'quinn.martinez@email.com', 'phone': '0418 888 888'},
        {'first_name': 'Blake', 'last_name': 'Anderson', 'email': 'blake.anderson@email.com', 'phone': '0419 999 999'},
        {'first_name': 'Hayden', 'last_name': 'Taylor', 'email': 'hayden.taylor@email.com', 'phone': '0420 000 000'},
    ]
    
    tenants = []
    for tenant_data in tenants_data:
        tenant = Tenant.objects.create(**tenant_data)
        print(f"Created tenant: {tenant}")
        tenants.append(tenant)
    
    return tenants

def create_fake_issue_types():
    """Create fake issue types"""
    issue_types_data = [
        {'name': 'Low Battery', 'description': 'Alarm battery needs replacement'},
        {'name': 'False Alarm', 'description': 'System triggering false alarms'},
        {'name': 'Sensor Fault', 'description': 'Motion sensor not working properly'},
        {'name': 'Panel Malfunction', 'description': 'Control panel showing errors'},
        {'name': 'Communication Error', 'description': 'System not communicating with monitoring station'},
        {'name': 'Power Supply Issue', 'description': 'Main power supply problems'},
        {'name': 'Siren Fault', 'description': 'Siren not sounding when triggered'},
        {'name': 'Keypad Fault', 'description': 'Keypad buttons not responding'},
        {'name': 'Zone Fault', 'description': 'Specific zone not arming/disarming'},
        {'name': 'Network Connectivity', 'description': 'Internet connectivity issues affecting monitoring'},
    ]
    
    issue_types = []
    for issue_data in issue_types_data:
        issue_type = IssueType.objects.create(**issue_data)
        print(f"Created issue type: {issue_type.name}")
        issue_types.append(issue_type)
    
    return issue_types

def create_fake_beeping_alarms(properties, tenants, issue_types):
    """Create 200 fake beeping alarms with realistic timestamps"""
    status_choices = [choice[0] for choice in BeepingAlarm.STATUS_CHOICES]
    
    # Get existing users for allocation
    users = list(User.objects.filter(is_staff=True))
    if not users:
        # Create a default user if none exist
        default_user = User.objects.create_user(
            username='default_tech',
            email='tech@ghhs.com',
            first_name='Default',
            last_name='Technician',
            is_staff=True
        )
        default_user.set_password('password123')
        default_user.save()
        users = [default_user]
    
    # Generate realistic timestamps from January 1, 2025 to today
    now = datetime.now()
    start_date = datetime(2025, 1, 1)
    
    # Calculate total days between start date and now
    total_days = (now - start_date).days
    
    alarms_created = 0
    for i in range(200):
        # Randomly select related objects
        property_obj = random.choice(properties)
        issue_type = random.choice(issue_types)
        status = random.choice(status_choices)
        
        # Set is_completed and is_cancelled based on status
        if status == 'completed':
            is_completed = True
            is_cancelled = False
        elif status == 'cancelled':
            is_completed = False
            is_cancelled = True
        else:
            is_completed = False
            is_cancelled = False
        
        # Generate random timestamp between January 1, 2025 and today
        random_days = random.randint(0, total_days)
        created_at = start_date + timedelta(
            days=random_days,
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )
        
        # Updated at is usually within a few days of created_at, but not before
        if status in ['completed', 'cancelled']:
            updated_at = created_at + timedelta(
                days=random.randint(1, 7),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
        elif status in ['new', 'requires_call_back']:
            if random.random() < 0.5:
                updated_at = created_at
            else:
                updated_at = created_at + timedelta(
                    hours=random.randint(1, 48),
                    minutes=random.randint(0, 59)
                )
        else:
            updated_at = created_at + timedelta(
                days=random.randint(0, 5),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
        
        # Create alarm WITHOUT custom timestamps first
        alarm = BeepingAlarm.objects.create(
            status=status,
            issue_type=issue_type,
            notes=random.choice([
                'Customer reported beeping sound coming from alarm panel',
                'Alarm system showing low battery warning',
                'False alarm triggered during testing',
                'Sensor appears to be malfunctioning',
                'Panel displaying error codes',
                'System not responding to keypad commands',
                'Communication failure with monitoring station',
                'Power supply issues detected',
                'Siren not functioning properly',
                'Zone 1 showing fault status',
                'Network connectivity problems',
                'Battery backup system needs attention',
                'Motion detector not arming correctly',
                'Door contact sensor faulty',
                'Glass break sensor needs calibration',
            ]),
            is_active=random.choice([True, True, True, False]),
            property=property_obj,
            is_customer_contacted=random.choice([True, False]),
            is_completed=is_completed,
            is_cancelled=is_cancelled,
        )
        
        # NOW update the timestamps using raw SQL to bypass auto_now restrictions
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE maintenance_beepingalarm 
                SET created_at = %s, updated_at = %s 
                WHERE id = %s
                """,
                [created_at, updated_at, alarm.id]
            )
        
        # Add random allocation (sometimes keep blank)
        allocation_choice = random.random()
        if allocation_choice < 0.2:
            # No allocation (20%)
            pass
        elif allocation_choice < 0.7:
            # 1 user (50%)
            allocated_users = random.sample(users, 1)
            alarm.allocation.set(allocated_users)
        else:
            # 2-3 users (30%)
            num_users = random.randint(2, min(3, len(users)))
            allocated_users = random.sample(users, num_users)
            alarm.allocation.set(allocated_users)
        
        alarms_created += 1
        if alarms_created % 50 == 0:
            print(f"Created {alarms_created} beeping alarms...")
    
    print(f"Successfully created {alarms_created} beeping alarms!")
    return alarms_created

def main():
    """Main function to generate all fake data"""
    print("🚀 Starting fresh fake data generation...")
    
    # Clear existing data first
    clear_existing_data()
    
    # Create agencies
    print("\n1. Creating agencies...")
    agencies = create_fake_agencies()
    
    # Create private owners
    print("\n2. Creating private owners...")
    private_owners = create_fake_private_owners()
    
    # Create properties
    print("\n3. Creating properties...")
    properties = create_fake_properties(agencies, private_owners)
    
    # Create tenants
    print("\n4. Creating tenants...")
    tenants = create_fake_tenants()

    # Assign tenants to properties
    print("\n4b. Assigning tenants to properties...")
    for property_obj in properties:
        num_tenants = random.randint(1, 3)
        assigned_tenants = random.sample(tenants, num_tenants)
        property_obj.tenants.set(assigned_tenants)
        property_obj.save()
    print(f"Assigned tenants to {len(properties)} properties.")

    # Create issue types
    print("\n5. Creating issue types...")
    issue_types = create_fake_issue_types()
    
    # Create beeping alarms
    print("\n6. Creating beeping alarms...")
    alarms_created = create_fake_beeping_alarms(properties, tenants, issue_types)
    
    print(f"\n✅ Fake data generation complete!")
    print(f"📊 Summary:")
    print(f"   - Agencies: {len(agencies)}")
    print(f"   - Private Owners: {len(private_owners)}")
    print(f"   - Properties: {len(properties)}")
    print(f"   - Tenants: {len(tenants)}")
    print(f"   - Issue Types: {len(issue_types)}")
    print(f"   - Beeping Alarms: {alarms_created}")
    
    print(f"\n🎯 You can now test your beeping alarms API!")

if __name__ == '__main__':
    main() 