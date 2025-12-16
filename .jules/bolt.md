## 2025-10-24 - Optimization of CPU Monitoring
**Learning:** `systeminformation.cpu()` is extremely expensive (~57ms) because it fetches static hardware info + speed. The dedicated `cpuCurrentSpeed()` function is ~70x faster (~1.5ms) and sufficient for periodic updates.
**Action:** When monitoring real-time metrics, always check if the library provides a dedicated "current value" function instead of a full "info" fetch. Profile heavy polling loops first.
