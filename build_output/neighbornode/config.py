from pydantic_settings import BaseSettings, SettingsConfigDict
import logging

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    
    aws_region: str = "us-east-1"
    dynamodb_table_name: str = "NeighborNodeTable"
    bedrock_model_id: str = "amazon.nova-lite-v1"
    bedrock_model_id_micro: str = "amazon.nova-micro-v1"
    pinpoint_app_id: str = ""
    pinpoint_origination_number: str = ""
    food_safety_exclusion_list: str = "config/food_safety_exclusions.json"
    supported_languages: str = "en,es"
    coordinator_phone: str = ""
    log_level: str = "INFO"
    agentcore_agent_id: str = ""

settings = Settings()

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
logger = logging.getLogger("neighbornode")
