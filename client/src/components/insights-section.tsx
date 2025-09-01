import { Card, CardContent } from "@/components/ui/card";
import type { NumerologyResult } from "@/pages/home";

interface InsightsSectionProps {
  result: NumerologyResult;
}

export default function InsightsSection({ result }: InsightsSectionProps) {
  const { calculation, insight } = result;

  const getMissingNumbers = () => {
    const present = new Set<number>();
    calculation.loShuGrid.forEach((row: number[]) => {
      row.forEach((cell: number) => {
        if (cell > 0) present.add(cell);
      });
    });
    
    const missing = [];
    for (let i = 1; i <= 9; i++) {
      if (!present.has(i)) missing.push(i);
    }
    return missing;
  };

  const missingNumbers = getMissingNumbers();

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Your Personalized Insights</h3>
          
          <div className="space-y-6">
            {/* AI Generated Insight */}
            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-primary-foreground">AI</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">NumenCoach Insight</h4>
                    <p className="text-muted-foreground" data-testid="text-ai-insight">
                      {insight}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Life Path Insight */}
            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-primary-foreground" data-testid="number-life-path-insight">
                      {calculation.lifePathNumber}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Life Path {calculation.lifePathNumber}</h4>
                    <p className="text-muted-foreground">
                      {getLifePathDescription(calculation.lifePathNumber)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Expression Insight */}
            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-foreground" data-testid="number-expression-insight">
                      {calculation.expressionNumber}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Expression {calculation.expressionNumber}</h4>
                    <p className="text-muted-foreground">
                      {getExpressionDescription(calculation.expressionNumber)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Lo Shu Missing Numbers */}
            {missingNumbers.length > 0 && (
              <Card className="border border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-accent-foreground text-lg">!</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">
                        Missing Numbers: {missingNumbers.join(', ')}
                      </h4>
                      <p className="text-muted-foreground" data-testid="text-missing-numbers">
                        ये numbers आपकी grid में missing हैं। इन energies को develop करना beneficial होगा। 
                        Practice aur conscious effort से इन qualities को strengthen कर सकते हैं।
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function getLifePathDescription(number: number): string {
  const descriptions: { [key: number]: string } = {
    1: "Aap ek natural leader हैं। Independence aur original thinking आपकी strength है। New projects start करना aur leadership roles लेना आपके लिए natural है।",
    2: "Cooperation aur teamwork में आप excel करते हैं। Diplomatic nature के साथ relationships building में आप skilled हैं। Peace aur harmony bring करना आपका gift है।",
    3: "Creative expression आपकी speciality है। Communication, art, या entertainment में success मिल सकती है। Optimistic nature के साथ logon को inspire करते हैं।",
    4: "Hard work aur practical approach आपकी key strength है। Organization aur systematic planning में आप excellent हैं। Steady progress से goals achieve करते हैं।",
    5: "Freedom aur adventure आपको attract करता है। Travel, change, aur new experiences आपके लिए important हैं। Versatile nature के साथ multiple interests हैं।",
    6: "Family aur community service आपकी priority है। Nurturing nature के साथ caring responsibilities naturally आते हैं। Healing aur helping others में fulfillment मिलता है।",
    7: "Spiritual seeking aur deep thinking आपकी nature है। Research, analysis, aur inner wisdom develop करना आपका path है। Solitude में clarity मिलती है।",
    8: "Material success aur business acumen आपकी strength है। Leadership in business aur financial management में excel करते हैं। Achievement aur recognition naturally आती है।",
    9: "Humanitarian service aur global thinking आपका purpose है। Compassion के साथ larger causes के लिए work करना fulfilling लगता है। Universal love aur understanding आपकी gift है।"
  };
  
  return descriptions[number] || "आपका Life Path number unique है और special qualities लेकर आता है।";
}

function getExpressionDescription(number: number): string {
  const descriptions: { [key: number]: string } = {
    1: "Leadership qualities aur innovative ideas express करना आपका natural talent है। Original thinking के साथ new paths create करते हैं।",
    2: "Cooperation aur peaceful solutions through communication आपकी specialty है। Diplomatic skills के साथ conflicts resolve करते हैं।",
    3: "Creative self-expression through words, art, या performance आपकी calling है। Joy aur positivity spread करना आपका gift है।",
    4: "Practical solutions aur systematic approach के through reliability demonstrate करते हैं। Building strong foundations आपकी expertise है।",
    5: "Versatility aur adaptability के through freedom express करते हैं। Change aur variety को embrace करना आपकी strength है।",
    6: "Caring nature aur responsibility के through service express करते हैं। Home, family aur community के लिए dedication show करते हैं।",
    7: "Deep analysis aur spiritual insight के through wisdom share करते हैं। Research aur contemplation आपके expression का medium है।",
    8: "Business skills aur material mastery के through authority establish करते हैं। Success aur achievement आपके expression का result है।",
    9: "Universal compassion aur humanitarian service के through love express करते हैं। Global perspective aur helping humanity आपका mission है।"
  };
  
  return descriptions[number] || "आपका Expression number unique talents aur abilities represent करता है।";
}
