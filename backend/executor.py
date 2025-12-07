# backend/executor.py
import asyncio, time, logging
logger = logging.getLogger("executor")
logging.basicConfig(level=logging.INFO)

class ActionExecutor:
    def __init__(self):
        # In prod: inject payment gateway client here
        pass

    async def execute(self, action_name: str, params: dict):
        logger.info(f"Execute action {action_name} params={params}")
        audit = {"action": action_name, "params": params, "ts": time.time()}
        if action_name == "pay_bill":
            return await self._mock_pay_bill(params, audit)
        if action_name == "track_card":
            return await self._mock_track_card(params, audit)
        return {"status":"error","message":"unknown_action"}

    async def _mock_pay_bill(self, params, audit):
        amount = params.get("amount", 0)
        if amount is None:
            return {"status":"error","message":"missing amount"}
        # step-up simulation
        if amount > 100000:
            return {"status":"requires_approval","message":"amount exceeds threshold"}
        await asyncio.sleep(0.6)
        tx_id = "TXN" + str(int(time.time()))
        result = {"status":"success","tx_id":tx_id,"amount": amount}
        logger.info({"audit": audit, "result": result})
        return result

    async def _mock_track_card(self, params, audit):
        await asyncio.sleep(0.2)
        return {"status":"in_transit","tracking_id": params.get("tracking_id", "TRK000"), "eta":"2025-12-07"}
