#!/bin/sh
# wait-for-it.sh: Simple script to wait for a service to be available
# Usage: wait-for-it.sh host:port [-t timeout] [-- command args]

TIMEOUT=15
QUIET=0

# Extract host and port
if [ -z "$1" ]; then
  echo "Usage: $0 host:port [-t timeout] [-- command args]"
  exit 1
fi

HOSTPORT=$1
HOST=${HOSTPORT%:*}
PORT=${HOSTPORT#*:}
shift

# Process options
while [ $# -gt 0 ]; do
  case "$1" in
    -q | --quiet)
      QUIET=1
      shift 1
      ;;
    -t | --timeout)
      TIMEOUT=$2
      shift 2
      ;;
    --)
      shift
      break
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# Display status messages unless quiet mode is enabled
status_message() {
  if [ "$QUIET" -ne 1 ]; then
    echo "$@"
  fi
}

# Wait for the host and port to be available
wait_for() {
  status_message "Waiting for $HOST:$PORT..."
  START_TS=$(date +%s)
  
  while :; do
    nc -z "$HOST" "$PORT" > /dev/null 2>&1
    result=$?
    
    if [ $result -eq 0 ]; then
      status_message "$HOST:$PORT is available after $(($(date +%s) - START_TS)) seconds"
      break
    fi
    
    # Check if the timeout has been exceeded
    if [ $(($(date +%s) - START_TS)) -gt "$TIMEOUT" ]; then
      status_message "Timeout reached after waiting $TIMEOUT seconds for $HOST:$PORT"
      exit 1
    fi
    
    # Wait for a second before retrying
    sleep 1
  done
  
  return 0
}

wait_for

# If additional command provided, execute it
if [ $# -gt 0 ]; then
  exec "$@"
fi