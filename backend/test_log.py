with open(r"C:\Users\abdul\.gemini\antigravity\brain\8fecfc4f-8c1e-48bb-847d-970cea97bdd0\.system_generated\tasks\task-765.log", "r") as f:
    lines = f.readlines()
for i in range(len(lines)-1, -1, -1):
    if "Traceback (most recent call last):" in lines[i] or "Error code:" in lines[i]:
        print("".join(lines[i:i+30]))
        break
