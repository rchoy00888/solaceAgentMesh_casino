This repository simulates 3 different casino operations cases using Solace Agent Mesh. There are 3 applications in this environment:
1. casino_pit:  A pit manager applications that manage 10 tables on a single GUI. If LLM decides that the betting pattern is violated, it will send the alert message to the Pit manager and the corresonding table
   will be flashed.
2. casino: This represents a betting table that allows user enter betting data. The entry will be sent to SAM as a real time events and SAM will evaluate base on criteria in the event_mesh_gateway description.
   (CUrrently set to 500% of average of last 20 bets).
3. casino-monitor. This web page will display the events received and the evaluation results. A critical alert will be received when LLM detect the violation scenario.

Note that SAM installation is not under the repository and only the config directory and sample database file are in the directory.
