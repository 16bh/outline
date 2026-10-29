import stores from "~/stores";

describe("DocumentsStore", () => {
  describe("get", () => {
    it("should return a document by id or by the urlId in a slug", () => {
      const doc = stores.documents.add({
        id: "5f1c2a7e-8a7b-4c3d-9e2f-1a2b3c4d5e6f",
        urlId: "AbCdEf1234",
        title: "Slug",
      });

      expect(stores.documents.get(doc.id)).toBe(doc);
      expect(stores.documents.get("slug-AbCdEf1234")).toBe(doc);
      expect(stores.documents.get("AbCdEf1234")).toBe(doc);
    });

    it("should not match a urlId at the end of an unknown UUID", () => {
      stores.documents.add({
        id: "0b9e7c52-3f0e-4a8f-b1a5-2d7f7d9c1e3a",
        urlId: "e056e0bb98",
        title: "Suffix",
      });

      expect(
        stores.documents.get("9b587fc1-01de-4f4a-aa79-07e056e0bb98")
      ).toBeUndefined();
    });
  });

  describe("editedByUser", () => {
    const userId = "22222222-2222-2222-2222-222222222222";
    const otherUserId = "33333333-3333-3333-3333-333333333333";

    beforeEach(() => {
      stores.documents.clear();
    });

    it("should include documents created by the user and collaborations", () => {
      const user = stores.users.add({ id: userId, name: "Editor" });
      const otherUser = stores.users.add({ id: otherUserId, name: "Other" });
      const created = stores.documents.add({
        id: "11111111-1111-1111-1111-111111111111",
        title: "Created by me",
        createdBy: user,
        updatedBy: user,
        collaboratorIds: [userId],
      });
      const collaborated = stores.documents.add({
        id: "44444444-4444-4444-4444-444444444444",
        title: "Created by someone else, edited by me",
        createdBy: otherUser,
        updatedBy: user,
        collaboratorIds: [otherUserId, userId],
      });
      stores.documents.add({
        id: "55555555-5555-5555-5555-555555555555",
        title: "Never edited by me",
        createdBy: otherUser,
        updatedBy: otherUser,
        collaboratorIds: [otherUserId],
      });
      stores.documents.add({
        id: "66666666-6666-6666-6666-666666666666",
        title: "No collaborators loaded",
      });

      const ids = stores.documents.editedByUser(userId).map((doc) => doc.id);
      expect(ids).toHaveLength(2);
      expect(ids).toEqual(
        expect.arrayContaining([created.id, collaborated.id])
      );
    });

    it("should retain documents edited later by others and sort by the document’s latest update", () => {
      const user = stores.users.add({ id: userId, name: "Editor" });
      const otherUser = stores.users.add({ id: otherUserId, name: "Other" });
      const collaborated = stores.documents.add({
        id: "11111111-1111-1111-1111-111111111111",
        title: "Edited yesterday",
        updatedBy: user,
        collaboratorIds: [otherUserId, userId],
        updatedAt: "2026-10-28T00:00:00.000Z",
      });
      const created = stores.documents.add({
        id: "44444444-4444-4444-4444-444444444444",
        title: "Edited this morning",
        updatedBy: user,
        collaboratorIds: [userId],
        updatedAt: "2026-10-29T00:00:00.000Z",
      });

      expect(
        stores.documents.editedByUser(userId).map((doc) => doc.id)
      ).toEqual([created.id, collaborated.id]);

      stores.documents.add({
        id: collaborated.id,
        updatedBy: otherUser,
        updatedAt: "2026-10-29T01:00:00.000Z",
      });

      expect(
        stores.documents.editedByUser(userId).map((doc) => doc.id)
      ).toEqual([collaborated.id, created.id]);
    });

    it("should exclude archived and deleted documents", () => {
      const active = stores.documents.add({
        id: "11111111-1111-1111-1111-111111111111",
        title: "Active",
        collaboratorIds: [userId],
      });
      stores.documents.add({
        id: "44444444-4444-4444-4444-444444444444",
        title: "Archived",
        collaboratorIds: [userId],
        archivedAt: "2026-10-29T00:00:00.000Z",
      });
      stores.documents.add({
        id: "55555555-5555-5555-5555-555555555555",
        title: "Deleted",
        collaboratorIds: [userId],
        deletedAt: "2026-10-29T00:00:00.000Z",
      });

      expect(
        stores.documents.editedByUser(userId).map((doc) => doc.id)
      ).toEqual([active.id]);
    });
  });

  describe("deleted", () => {
    it("should filter by the user that deleted the document", () => {
      const deleter = stores.users.add({
        id: "22222222-2222-2222-2222-222222222222",
        name: "Deleter",
      });
      const other = stores.users.add({
        id: "33333333-3333-3333-3333-333333333333",
        name: "Other",
      });

      const mine = stores.documents.add({
        id: "11111111-1111-1111-1111-111111111111",
        title: "Deleted by me",
        deletedAt: "2026-08-18T00:00:00.000Z",
        deletedBy: deleter,
      });
      stores.documents.add({
        id: "44444444-4444-4444-4444-444444444444",
        title: "Deleted by someone else",
        deletedAt: "2026-08-18T00:00:00.000Z",
        deletedBy: other,
      });

      const results = stores.documents.deleted({ userId: deleter.id });
      expect(results.map((doc) => doc.id)).toEqual([mine.id]);
    });
  });
});
