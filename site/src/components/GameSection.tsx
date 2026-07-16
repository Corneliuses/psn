/** One normalized row for a game list, regardless of its source stat. */
export interface GameEntry {
  /** Stable key for React lists (titleId or npCommunicationId). */
  id: string;
  iconUrl: string;
  name: string;
  /** The section's relevant metric, pre-formatted for display. */
  metric: string;
}

export interface GameSectionProps {
  heading: string;
  games: GameEntry[];
  /** Message shown when there are no games in this section. */
  emptyLabel?: string;
}

export function GameSection({ heading, games, emptyLabel = 'No games yet' }: GameSectionProps) {
  return (
    <section>
      <h2>{heading}</h2>
      {games.length === 0 ? (
        <p>{emptyLabel}</p>
      ) : (
        <ul>
          {games.map((game) => (
            <li key={game.id}>
              {/* Decorative: the game name is rendered as adjacent text, so an
                  empty alt keeps assistive tech from announcing it twice. */}
              <img src={game.iconUrl} alt="" width={48} height={48} />
              <span>{game.name}</span>
              <span>{game.metric}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
