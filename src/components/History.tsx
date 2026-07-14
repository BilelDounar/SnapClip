interface HistoryProps {
  items: string[];
  onPick: (text: string) => void;
}

export function History({items, onPick}: HistoryProps) {
  return (
    <div className="history">
      {items.map((item, index) => (
        <button
          key={`${index}-${item.slice(0, 12)}`}
          className="history__item"
          title={item}
          onClick={() => onPick(item)}>
          {item.replace(/\n/g, ' ')}
        </button>
      ))}
    </div>
  );
}
