import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestLog } from './QuestLog';

// Mock Recorder since it uses framer-motion which might need mocking in jsdom
// But for basic callback structure testing, we might just trigger callbacks if possible.
// Actually, triggering reorder via drag-n-drop in jsdom is hard.
// We will test the prop interface primarily and static rendering.
// Since we used Reorder.Group, we rely on framer-motion for the drag.
// Here we will mock Reorder components to be simple divs to test logic if needed,
// or just test the other interactions.

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    Reorder: {
      Group: ({ children }: any) => (
        <div data-testid="reorder-group">
          {children}
          {/* Expose a way to trigger reorder for testing if needed, or just skip drag test */}
        </div>
      ),
      Item: ({ children, value, ...props }: any) => (
         <div data-testid={`reorder-item-${value.id}`} {...props}>
            {children}
         </div>
      ),
    },
     AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});


const mockQuests = [
  { id: 'q1', title: 'Quest 1', status: 'active' as const },
  { id: 'q2', title: 'Quest 2', status: 'pending' as const },
];

describe('QuestLog', () => {
  it('renders quests', () => {
    render(
      <QuestLog
        quests={mockQuests}
        onSelectQuest={() => {}}
        onAddQuest={() => {}}
        onEditQuest={() => {}}
        onDeleteQuest={() => {}}
        onReorder={() => {}}
      />
    );
    expect(screen.getByText('Quest 1')).toBeInTheDocument();
    expect(screen.getByText('Quest 2')).toBeInTheDocument();
  });

  it('triggers onSelectQuest when clicked', () => {
    const onSelect = vi.fn();
    render(
      <QuestLog
        quests={mockQuests}
        onSelectQuest={onSelect}
        onAddQuest={() => {}}
        onEditQuest={() => {}}
        onDeleteQuest={() => {}}
        onReorder={() => {}}
      />
    );
    
    fireEvent.click(screen.getByText('Quest 1'));
    expect(onSelect).toHaveBeenCalledWith('q1');
  });

  it('hides add button when canManage is false', () => {
    render(
      <QuestLog
        quests={mockQuests}
        canManage={false}
        onSelectQuest={() => {}}
        onAddQuest={() => {}}
        onEditQuest={() => {}}
        onDeleteQuest={() => {}}
        onReorder={() => {}}
      />
    );
    expect(screen.queryByLabelText('Add Quest')).not.toBeInTheDocument();
  });

  it('shows add button when canManage is true', () => {
    render(
      <QuestLog
        quests={mockQuests}
        canManage={true}
        onSelectQuest={() => {}}
        onAddQuest={() => {}}
        onEditQuest={() => {}}
        onDeleteQuest={() => {}}
        onReorder={() => {}}
      />
    );
    expect(screen.getByLabelText('Add Quest')).toBeInTheDocument();
  });
});
