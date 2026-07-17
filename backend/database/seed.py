from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database.models import HCP, Product, Interaction, InteractionType, SentimentType
from backend.database.connection import AsyncSessionLocal


SAMPLE_HCPS = [
    {"first_name": "Sarah", "last_name": "Johnson", "specialty": "Cardiologist", "affiliation": "Boston Medical Center", "email": "s.johnson@bmc.org", "phone": "617-555-0101", "npi_number": "1234567890", "city": "Boston", "state": "MA"},
    {"first_name": "Michael", "last_name": "Chen", "specialty": "Endocrinologist", "affiliation": "UCSF Medical Center", "email": "m.chen@ucsf.edu", "phone": "415-555-0102", "npi_number": "1234567891", "city": "San Francisco", "state": "CA"},
    {"first_name": "Emily", "last_name": "Rodriguez", "specialty": "Oncologist", "affiliation": "MD Anderson Cancer Center", "email": "e.rodriguez@mdanderson.org", "phone": "713-555-0103", "npi_number": "1234567892", "city": "Houston", "state": "TX"},
    {"first_name": "James", "last_name": "Williams", "specialty": "Neurologist", "affiliation": "Mayo Clinic", "email": "j.williams@mayo.edu", "phone": "507-555-0104", "npi_number": "1234567893", "city": "Rochester", "state": "MN"},
    {"first_name": "Priya", "last_name": "Patel", "specialty": "Rheumatologist", "affiliation": "Johns Hopkins Hospital", "email": "p.patel@jhmi.edu", "phone": "410-555-0105", "npi_number": "1234567894", "city": "Baltimore", "state": "MD"},
    {"first_name": "David", "last_name": "Kim", "specialty": "Cardiologist", "affiliation": "Cleveland Clinic", "email": "d.kim@ccf.org", "phone": "216-555-0106", "npi_number": "1234567895", "city": "Cleveland", "state": "OH"},
    {"first_name": "Amanda", "last_name": "Foster", "specialty": "Pulmonologist", "affiliation": "Duke University Hospital", "email": "a.foster@duke.edu", "phone": "919-555-0107", "npi_number": "1234567896", "city": "Durham", "state": "NC"},
    {"first_name": "Robert", "last_name": "Martinez", "specialty": "Diabetologist", "affiliation": "Stanford Health Care", "email": "r.martinez@stanford.edu", "phone": "650-555-0108", "npi_number": "1234567897", "city": "Palo Alto", "state": "CA"},
    {"first_name": "Lisa", "last_name": "Thompson", "specialty": "Hematologist", "affiliation": "Memorial Sloan Kettering", "email": "l.thompson@mskcc.org", "phone": "212-555-0109", "npi_number": "1234567898", "city": "New York", "state": "NY"},
    {"first_name": "Christopher", "last_name": "Anderson", "specialty": "Cardiologist", "affiliation": "Northwestern Medicine", "email": "c.anderson@nm.org", "phone": "312-555-0110", "npi_number": "1234567899", "city": "Chicago", "state": "IL"},
]

SAMPLE_PRODUCTS = [
    {"name": "Cardiomax", "therapeutic_area": "Cardiovascular", "description": "Novel ACE inhibitor for heart failure management with proven 30% reduction in hospitalization rates."},
    {"name": "GlycoGuard", "therapeutic_area": "Diabetes", "description": "Next-generation GLP-1 receptor agonist for Type 2 diabetes with superior HbA1c reduction."},
    {"name": "NeuroPlex", "therapeutic_area": "Neurology", "description": "Breakthrough CGRP antagonist for migraine prevention with monthly dosing convenience."},
    {"name": "RheumaClear", "therapeutic_area": "Rheumatology", "description": "Biologic JAK inhibitor for moderate-to-severe rheumatoid arthritis and psoriatic arthritis."},
    {"name": "OncoShield", "therapeutic_area": "Oncology", "description": "Targeted PD-L1 checkpoint inhibitor for non-small cell lung cancer and bladder cancer."},
]


async def seed_database():
    """Seed the database with sample data if tables are empty."""
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        result = await session.execute(select(HCP).limit(1))
        if result.scalar_one_or_none():
            return  # Already seeded

        # Insert HCPs
        hcp_objects = [HCP(**data) for data in SAMPLE_HCPS]
        session.add_all(hcp_objects)
        await session.flush()

        # Insert Products
        product_objects = [Product(**data) for data in SAMPLE_PRODUCTS]
        session.add_all(product_objects)
        await session.flush()

        # Insert sample interactions
        sample_interactions = [
            Interaction(
                hcp_id=hcp_objects[0].id,
                rep_name="Alex Turner",
                interaction_type=InteractionType.detail_call,
                date=datetime(2025, 7, 10, 10, 0, tzinfo=timezone.utc),
                notes="Discussed Cardiomax efficacy data for heart failure patients. Dr. Johnson showed strong interest in the PARADIGM-HF trial results. She mentioned that 3 of her patients might be good candidates. Agreed to provide sample packs next visit.",
                ai_summary="Positive detail call regarding Cardiomax for heart failure. HCP interested in trial data. 3 potential patients identified. Follow-up with samples planned.",
                sentiment=SentimentType.positive,
                products_discussed=["Cardiomax"],
                follow_up_actions=["Bring Cardiomax samples", "Send PARADIGM-HF study reprint"],
            ),
            Interaction(
                hcp_id=hcp_objects[1].id,
                rep_name="Alex Turner",
                interaction_type=InteractionType.virtual_meeting,
                date=datetime(2025, 7, 12, 14, 0, tzinfo=timezone.utc),
                notes="Virtual meeting to present GlycoGuard phase 3 results. Dr. Chen expressed concerns about patient compliance with weekly injections. Discussed the once-monthly option. He requested clinical comparison data vs Ozempic.",
                ai_summary="Virtual meeting on GlycoGuard. HCP has compliance concerns with injection frequency. Once-monthly option discussed. Competitive comparison data requested.",
                sentiment=SentimentType.neutral,
                products_discussed=["GlycoGuard"],
                follow_up_actions=["Send GlycoGuard vs Ozempic comparative study", "Schedule 2-week follow-up call"],
            ),
            Interaction(
                hcp_id=hcp_objects[2].id,
                rep_name="Alex Turner",
                interaction_type=InteractionType.sample_drop,
                date=datetime(2025, 7, 14, 9, 30, tzinfo=timezone.utc),
                notes="Dropped off OncoShield samples and updated prescribing information. Dr. Rodriguez was busy but took a few minutes to review the new NSCLC indication. Left materials with her assistant.",
                ai_summary="Sample drop for OncoShield. Brief engagement with HCP. New NSCLC indication materials left. Low-priority follow-up.",
                sentiment=SentimentType.neutral,
                products_discussed=["OncoShield"],
                follow_up_actions=["Follow up in 2 weeks for feedback on OncoShield samples"],
            ),
            Interaction(
                hcp_id=hcp_objects[0].id,
                rep_name="Alex Turner",
                interaction_type=InteractionType.phone_call,
                date=datetime(2025, 7, 15, 11, 0, tzinfo=timezone.utc),
                notes="Follow-up call with Dr. Johnson. She has started 2 patients on Cardiomax. Both tolerating well so far. She asked about the patient assistance program for uninsured patients.",
                ai_summary="Follow-up call. 2 patients started on Cardiomax with good tolerance. Patient assistance program inquiry raised.",
                sentiment=SentimentType.positive,
                products_discussed=["Cardiomax"],
                follow_up_actions=["Send patient assistance program enrollment forms", "Check back in 30 days on patient outcomes"],
            ),
            Interaction(
                hcp_id=hcp_objects[3].id,
                rep_name="Alex Turner",
                interaction_type=InteractionType.conference,
                date=datetime(2025, 7, 16, 16, 0, tzinfo=timezone.utc),
                notes="Met Dr. Williams at the AAN Annual Conference. Brief hallway conversation about NeuroPlex for migraine prevention. He was skeptical about the CGRP mechanism. Invited him to our satellite symposium tomorrow.",
                ai_summary="Brief conference encounter. HCP skeptical about CGRP mechanism. Invited to company symposium for deeper engagement.",
                sentiment=SentimentType.negative,
                products_discussed=["NeuroPlex"],
                follow_up_actions=["Ensure Dr. Williams attends satellite symposium", "Prepare detailed MOA presentation"],
            ),
        ]
        session.add_all(sample_interactions)
        await session.commit()
        print("Database seeded successfully with sample HCPs, products, and interactions.")
