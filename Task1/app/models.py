from sqlalchemy import Column, String, Integer, DateTime
from .database import Base

class CallEvent(Base):
    __tablename__ = "call_events"

    # Using event_id as the primary key automatically solves the duplicate problem.
    event_id = Column(String, primary_key=True, index=True)
    event_type = Column(String, nullable=False)
    account_id = Column(String, nullable=False, index=True)
    call_id = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    duration_seconds = Column(Integer, default=0)
    

    cost_cents = Column(Integer, default=0) 
    destination_country = Column(String)