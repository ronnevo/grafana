import { SearchSrv } from "app/core/services/search_srv";
import { BackendSrvMock } from "test/mocks/backend_srv";
import impressionSrv from "app/core/services/impression_srv";
import { contextSrv } from "app/core/services/context_srv";
import { beforeEach } from "test/lib/common";

jest.mock("app/core/store", () => {
  return {
    getBool: jest.fn(),
    set: jest.fn()
  };
});

jest.mock("app/core/services/impression_srv", () => {
  return {
    getDashboardOpened: jest.fn
  };
});

describe("SearchSrv", () => {
  let searchSrv, backendSrvMock;

  beforeEach(() => {
    backendSrvMock = new BackendSrvMock();
    searchSrv = new SearchSrv(backendSrvMock, Promise);

    contextSrv.isSignedIn = true;
    impressionSrv.getDashboardOpened = jest.fn().mockReturnValue([]);
  });

  describe("With recent dashboards", () => {
    let results;

    beforeEach(() => {
      backendSrvMock.search = jest
        .fn()
        .mockReturnValueOnce(
          Promise.resolve([
            { id: 2, title: "second but first" },
            { id: 1, title: "first but second" }
          ])
        )
        .mockReturnValue(Promise.resolve([]));

      impressionSrv.getDashboardOpened = jest.fn().mockReturnValue([1, 2]);

      return searchSrv.search({ query: "" }).then(res => {
        results = res;
      });
    });

    it("should include recent dashboards section", () => {
      expect(results[0].title).toBe("Recent Boards");
    });

    it("should return order decided by impressions store not api", () => {
      expect(results[0].items[0].title).toBe("first but second");
      expect(results[0].items[1].title).toBe("second but first");
    });

    describe("and 3 recent dashboards removed in backend", () => {
      let results;

      beforeEach(() => {
        backendSrvMock.search = jest
          .fn()
          .mockReturnValueOnce(
            Promise.resolve([{ id: 2, title: "two" }, { id: 1, title: "one" }])
          )
          .mockReturnValue(Promise.resolve([]));

        impressionSrv.getDashboardOpened = jest
          .fn()
          .mockReturnValue([4, 5, 1, 2, 3]);

        return searchSrv.search({ query: "" }).then(res => {
          results = res;
        });
      });

      it("should return 2 dashboards", () => {
        expect(results[0].items.length).toBe(2);
        expect(results[0].items[0].id).toBe(1);
        expect(results[0].items[1].id).toBe(2);
      });
    });
  });

  describe("With starred dashboards", () => {
    let results;

    beforeEach(() => {
      backendSrvMock.search = jest
        .fn()
        .mockReturnValue(Promise.resolve([{ id: 1, title: "starred" }]));

      return searchSrv.search({ query: "" }).then(res => {
        results = res;
      });
    });

    it("should include starred dashboards section", () => {
      expect(results[0].title).toBe("Starred Boards");
      expect(results[0].items.length).toBe(1);
    });
  });

  describe("With starred dashboards and recent", () => {
    let results;

    beforeEach(() => {
      backendSrvMock.search = jest
        .fn()
        .mockReturnValueOnce(
          Promise.resolve([
            { id: 1, title: "starred and recent", isStarred: true },
            { id: 2, title: "recent" }
          ])
        )
        .mockReturnValue(
          Promise.resolve([{ id: 1, title: "starred and recent" }])
        );

      impressionSrv.getDashboardOpened = jest.fn().mockReturnValue([1, 2]);
      return searchSrv.search({ query: "" }).then(res => {
        results = res;
      });
    });

    it("should not show starred in recent", () => {
      expect(results[1].title).toBe("Recent Boards");
      expect(results[1].items[0].title).toBe("recent");
    });

    it("should show starred", () => {
      expect(results[0].title).toBe("Starred Boards");
      expect(results[0].items[0].title).toBe("starred and recent");
    });
  });

  describe("with no query string and dashboards with folders returned", () => {
    let results;

    beforeEach(() => {
      backendSrvMock.search = jest
        .fn()
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValue(
          Promise.resolve([
            {
              title: "folder1",
              type: "dash-folder",
              id: 1
            },
            {
              title: "dash with no folder",
              type: "dash-db",
              id: 2
            },
            {
              title: "dash in folder1 1",
              type: "dash-db",
              id: 3,
              folderId: 1
            },
            {
              title: "dash in folder1 2",
              type: "dash-db",
              id: 4,
              folderId: 1
            }
          ])
        );

      return searchSrv.search({ query: "" }).then(res => {
        results = res;
      });
    });

    it("should create sections for each folder and root", () => {
      expect(results).toHaveLength(2);
    });

    it("should place folders first", () => {
      expect(results[0].title).toBe("folder1");
    });
  });

  describe("with query string and dashboards with folders returned", () => {
    let results;

    beforeEach(() => {
      backendSrvMock.search = jest.fn();

      backendSrvMock.search.mockReturnValue(
        Promise.resolve([
          {
            id: 2,
            title: "dash with no folder",
            type: "dash-db"
          },
          {
            id: 3,
            title: "dash in folder1 1",
            type: "dash-db",
            folderId: 1,
            folderTitle: "folder1"
          }
        ])
      );

      return searchSrv.search({ query: "search" }).then(res => {
        results = res;
      });
    });

    it("should not specify folder ids", () => {
      expect(backendSrvMock.search.mock.calls[0][0].folderIds).toHaveLength(0);
    });

    it("should group results by folder", () => {
      expect(results).toHaveLength(2);
    });
  });

  describe("with tags", () => {
    beforeEach(() => {
      backendSrvMock.search = jest.fn();
      backendSrvMock.search.mockReturnValue(Promise.resolve([]));

      return searchSrv.search({ tag: ["atag"] }).then(() => {});
    });

    it("should send tags query to backend search", () => {
      expect(backendSrvMock.search.mock.calls[0][0].tag).toHaveLength(1);
    });
  });

  describe("with starred", () => {
    beforeEach(() => {
      backendSrvMock.search = jest.fn();
      backendSrvMock.search.mockReturnValue(Promise.resolve([]));

      return searchSrv.search({ starred: true }).then(() => {});
    });

    it("should send starred query to backend search", () => {
      expect(backendSrvMock.search.mock.calls[0][0].starred).toEqual(true);
    });
  });

  describe("when skipping recent dashboards", () => {
    let getRecentDashboardsCalled = false;

    beforeEach(() => {
      backendSrvMock.search = jest.fn();
      backendSrvMock.search.mockReturnValue(Promise.resolve([]));

      searchSrv.getRecentDashboards = () => {
        getRecentDashboardsCalled = true;
      };

      return searchSrv.search({ skipRecent: true }).then(() => {});
    });

    it("should not fetch recent dashboards", () => {
      expect(getRecentDashboardsCalled).toBeFalsy();
    });
  });

  describe("when skipping starred dashboards", () => {
    let getStarredCalled = false;

    beforeEach(() => {
      backendSrvMock.search = jest.fn();
      backendSrvMock.search.mockReturnValue(Promise.resolve([]));
      impressionSrv.getDashboardOpened = jest.fn().mockReturnValue([]);

      searchSrv.getStarred = () => {
        getStarredCalled = true;
      };

      return searchSrv.search({ skipStarred: true }).then(() => {});
    });

    it("should not fetch starred dashboards", () => {
      expect(getStarredCalled).toBeFalsy();
    });
  });
});
