import { api, ApiError } from "@/api/client";
import { getClientId } from "@/lib/storage";
import { getAuthToken } from "@/lib/storage/auth";

export interface VoteHistoryDto {
  memberId: string;
  memberName: string;
  voteValue: string;
}

export interface EncounterHistoryDto {
  encounterId: string;
  completedAt: string;
  sealedOutcome: number | null;
  votes: VoteHistoryDto[];
  distribution: Record<string, number>;
}

export interface QuestHistoryDto {
  questId: string;
  title: string;
  description: string;
  externalId: string | null;
  externalUrl: string | null;
  order: number;
  encounters: EncounterHistoryDto[];
}

export interface RealmHistoryResponseDto {
  realmCode: string;
  questHistories: QuestHistoryDto[];
}

export interface CsvImportResultDto {
  successCount: number;
  errorCount: number;
  errors: string[];
}

const resolveAuthHeader = (realmCode: string): Record<string, string> => {
  const realmToken = sessionStorage.getItem(`pointrealm:v1:realm:${realmCode}:token`);
  if (realmToken) {
    return { Authorization: `Bearer ${realmToken}` };
  }

  const authToken = getAuthToken();
  if (authToken) {
    return { Authorization: `Bearer ${authToken}` };
  }

  return {};
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const realmRecapApi = {
  getRealmHistory: (realmCode: string) =>
    api.get<RealmHistoryResponseDto>(`/realms/${realmCode}/history`),

  async exportQuestsCsv(realmCode: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/realms/${realmCode}/export/csv`, {
      method: "GET",
      headers: {
        "X-PointRealm-ClientId": getClientId(),
        ...resolveAuthHeader(realmCode),
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    return response.blob();
  },

  async importQuestsCsv(realmCode: string, file: File): Promise<CsvImportResultDto> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/realms/${realmCode}/quests/import/csv`, {
      method: "POST",
      headers: {
        "X-PointRealm-ClientId": getClientId(),
        ...resolveAuthHeader(realmCode),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    return response.json();
  },
};
