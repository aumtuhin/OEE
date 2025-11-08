import { Button } from "@/components/ui/button";
import { Download, Factory } from "lucide-react";

import productionData from "@/data/production-data.json";

function App() {
  const data = productionData

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Factory className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Production Line OEE Dashboard
                </h1>
                <p className="text-muted-foreground">
                  {data.productionLine.name} (<span>{data.metadata.site}</span>)
                </p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">
                {data.shifts[0].name}: {data.metadata.reportDate}
              </p>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
