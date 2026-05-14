This repository simulates 3 different casino operations cases using Solace Agent Mesh. There are 3 applications in this environment:
1. casino_pit:  A pit manager applications that manage 10 tables on a single GUI. If LLM decides that the betting pattern is violated, it will send the alert message to the Pit manager and the corresonding table
   will be flashed.
2. casino: This represents a betting table that allows user enter betting data. The entry will be sent to SAM as a real time events and SAM will evaluate base on criteria in the event_mesh_gateway description.
   (CUrrently set to 500% of average of last 20 bets).
3. casino-monitor. This web page will display the events received and the evaluation results. A critical alert will be received when LLM detect the violation scenario.

Note that SAM installation is not under the repository and only the config directory and sample database file are in the directory. Sam configuration files are under the demo2 folder.

Casino:

<img width="391" height="208" alt="image" src="https://github.com/user-attachments/assets/a85633fa-479d-4ad1-bd0a-f4012b341158" />

casino-pit:

<img width="335" height="170" alt="image" src="https://github.com/user-attachments/assets/70ec7fa4-dfb3-481c-b90e-00765b7b3ae0" />

casino-monitor:

<img width="1959" height="458" alt="image" src="https://github.com/user-attachments/assets/34ebc1c0-cfac-4b18-ae1e-f47122fc50fb" />

The demo will connect to a postgresql database that contains customer information.

Demo Flow:

<img width="1073" height="567" alt="image" src="https://github.com/user-attachments/assets/b52fa3de-96b8-43eb-8f36-8e5b37a833ef" />

Schema Info:

1.  BetRsult:

{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Generated Schema",
  "type": "object",
  "properties": {
    "userID": {
      "type": "string"
    },
    "betAmount": {
      "type": "integer"
    },
    "tableno": {
      "type": "string"
    },
    "dealerID": {
      "type": "string"
    },
    "winlose": {
      "type": "string"
    },
    "timestamp": {
      "type": "string"
    }
  },
  "required": [
    "userID",
    "betAmount",
    "tableno",
    "dealerID",
    "winlose",
    "timestamp"
  ]
}

Sample:
{
  "userID": "A13456",
  "betAmount": 1000,
  "tableno": "T00001",
  "dealerID": "D12345",
  "winlose":  "W",
  "timestamp": "2026/05/14 12:00:00"
}

Event Flow:

<img width="756" height="481" alt="image" src="https://github.com/user-attachments/assets/b1d0d22f-71ee-4ea3-871c-78fc7fd811d4" />

