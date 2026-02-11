import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestManagementDialog } from './QuestManagementDialog';
import { useRealmStore } from '@/state/realmStore';

const mockClient = {
  addQuest: vi.fn(),
  updateQuest: vi.fn(),
  deleteQuest: vi.fn(),
  reorderQuests: vi.fn(),
  requestFullSnapshot: vi.fn(),
};

vi.mock('@/app/providers/RealtimeProvider', () => ({
  useRealmClient: () => mockClient,
}));

const mockExportCsv = vi.fn();
const mockImportCsv = vi.fn();
vi.mock('@/api/realmRecap', () => ({
  realmRecapApi: {
    exportQuestsCsv: (...args: unknown[]) => mockExportCsv(...args),
    importQuestsCsv: (...args: unknown[]) => mockImportCsv(...args),
  },
}));


vi.mock('@/theme/ThemeModeProvider', () => ({
  useThemeMode: () => ({
    mode: {
      key: 'minimal',
      labels: { facilitator: 'GM', quest: 'Quest', realm: 'Realm' },
      phrases: { facilitatorTitle: 'Guide', activeQuest: 'Active Quest', beginQuest: 'Begin Quest' },
      styles: { sectionTitle: '', sectionSubtitle: '' },
    },
  }),
}));
describe('QuestManagementDialog', () => {
  const quests = [
    { id: 'q1', title: 'First Quest' },
    { id: 'q2', title: 'Second Quest' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient.addQuest.mockResolvedValue({ success: true });
    mockClient.updateQuest.mockResolvedValue({ success: true });
    mockClient.deleteQuest.mockResolvedValue({ success: true });
    mockClient.reorderQuests.mockResolvedValue({ success: true });
    mockClient.requestFullSnapshot.mockResolvedValue(undefined);

    mockExportCsv.mockResolvedValue(new Blob(['title']));
    mockImportCsv.mockResolvedValue({ successCount: 1, errorCount: 0, errors: [] });

    useRealmStore.setState({
      realmSnapshot: {
        realmCode: 'ABCD12',
        themeKey: 'default',
        realmVersion: 1,
        questLogVersion: 3,
        encounterVersion: null,
        settings: {
          deckType: 'fibonacci',
          autoReveal: false,
          allowAbstain: true,
          hideVoteCounts: false,
          allowEmojiReactions: true,
        },
        partyRoster: { members: [] },
        questLog: {
          quests: [
            { id: 'q1', title: 'First Quest', description: '', status: 'Pending', orderIndex: 0, version: 11 },
            { id: 'q2', title: 'Second Quest', description: '', status: 'Pending', orderIndex: 1, version: 12 },
          ],
        },
        encounter: null,
      },
    });
  });

  it('allows editing and deleting quests for GM users', async () => {
    render(
      <QuestManagementDialog
        isOpen
        onClose={() => {}}
        quests={quests}
        activeQuestId="q1"
        canManage
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit First Quest' }));
    const editInput = screen.getByLabelText('Edit title for First Quest');
    fireEvent.change(editInput, { target: { value: 'Updated Quest' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockClient.updateQuest).toHaveBeenCalledWith({
        questId: 'q1',
        title: 'Updated Quest',
        description: '',
        questVersion: 11,
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete Second Quest' }));

    await waitFor(() => {
      expect(mockClient.deleteQuest).toHaveBeenCalledWith({
        questId: 'q2',
        questVersion: 12,
        questLogVersion: 3,
      });
    });
  });

  it('reorders quests with keyboard shortcuts', async () => {
    render(
      <QuestManagementDialog
        isOpen
        onClose={() => {}}
        quests={quests}
        activeQuestId="q1"
        canManage
      />
    );

    const secondQuest = screen.getByLabelText('Quest Second Quest. 2 of 2');
    fireEvent.keyDown(secondQuest, { key: 'ArrowUp', altKey: true });

    await waitFor(() => {
      expect(mockClient.reorderQuests).toHaveBeenCalledWith({
        newOrder: ['q2', 'q1'],
        questLogVersion: 3,
      });
    });
  });

  it('hides GM actions for non-managers', () => {
    render(
      <QuestManagementDialog
        isOpen
        onClose={() => {}}
        quests={quests}
        activeQuestId="q1"
        canManage={false}
      />
    );

    expect(screen.queryByRole('button', { name: /Edit First Quest/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import CSV/i })).toBeDisabled();
    expect(screen.getByText(/Only the GM can edit the quest log/i)).toBeInTheDocument();
  });

  it('supports CSV import and export actions', async () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(
      <QuestManagementDialog
        isOpen
        onClose={() => {}}
        quests={quests}
        activeQuestId="q1"
        canManage
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }));

    await waitFor(() => {
      expect(mockExportCsv).toHaveBeenCalledWith('ABCD12');
      expect(clickSpy).toHaveBeenCalled();
    });

    const csvFile = new File(['title'], 'quests.csv', { type: 'text/csv' });
    const importInput = screen.getByLabelText('Import quest CSV');
    fireEvent.change(importInput, { target: { files: [csvFile] } });

    await waitFor(() => {
      expect(mockImportCsv).toHaveBeenCalledWith('ABCD12', csvFile);
      expect(mockClient.requestFullSnapshot).toHaveBeenCalled();
    });

    createObjectUrl.mockRestore();
    revokeObjectUrl.mockRestore();
  });
});
