interface LoShuGridProps {
  grid: number[][];
}

export default function LoShuGrid({ grid }: LoShuGridProps) {
  if (!grid || grid.length !== 3 || grid[0].length !== 3) {
    return (
      <div className="text-center text-muted-foreground">
        Invalid grid data
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="lo-shu-grid w-48 mx-auto mb-4" data-testid="lo-shu-grid">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`lo-shu-cell ${cell > 0 ? 'present' : 'missing'}`}
              data-testid={`lo-shu-cell-${rowIndex}-${colIndex}`}
            >
              {cell > 0 ? cell : ''}
            </div>
          ))
        )}
      </div>
      <div className="text-sm text-muted-foreground text-center space-y-1">
        <div>
          <span className="inline-block w-3 h-3 bg-primary rounded mr-2"></span>
          Present Numbers
        </div>
        <div>
          <span className="inline-block w-3 h-3 bg-muted rounded mr-2"></span>
          Missing Numbers
        </div>
      </div>
    </div>
  );
}
