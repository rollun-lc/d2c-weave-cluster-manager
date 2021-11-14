# d2c-weave-cluster-manager
Service that helps weave net (used by D2C.io) recover after failures

## How it works

every 5 minutes
- fetch all services & hosts from D2C API
- fetch all hostnames & hosts, registered in weave net
- compare
    - If for some host we have more than 80% services unavailable, we consider this host unavailable (should be unavailable 5 time in a row to be considered unhealthy)
    - If more than 50% of hosts are unavailable, consider cluster manager (this service) unhealthy and reboot the host

If host considered unhealthy it will be rebooted by cluster manager

### Production

repo contains install & update scripts

- install.sh - will create systemd service, enable it to run on startup and starts it. Also updates service, if already exists

to install service run
```shell
curl -s https://raw.githubusercontent.com/rollun-com/d2c-weave-cluster-manager/master/install.sh | bash
```
