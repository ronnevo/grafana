import _ from "lodash";
import { DashboardModel } from "../dashboard_model";
import { expect } from "test/lib/common";

jest.mock("app/core/services/context_srv", () => ({}));

describe("given dashboard with panel repeat in horizontal direction", function() {
  var dashboard;

  beforeEach(function() {
    dashboard = new DashboardModel({
      panels: [
        {
          id: 2,
          repeat: "apps",
          repeatDirection: "h",
          gridPos: { x: 0, y: 0, h: 2, w: 24 }
        }
      ],
      templating: {
        list: [
          {
            name: "apps",
            current: {
              text: "se1, se2, se3",
              value: ["se1", "se2", "se3"]
            },
            options: [
              { text: "se1", value: "se1", selected: true },
              { text: "se2", value: "se2", selected: true },
              { text: "se3", value: "se3", selected: true },
              { text: "se4", value: "se4", selected: false }
            ]
          }
        ]
      }
    });
    dashboard.processRepeats();
  });

  it("should repeat panel 3 times", function() {
    expect(dashboard.panels.length).toBe(3);
  });

  it("should mark panel repeated", function() {
    expect(dashboard.panels[0].repeat).toBe("apps");
    expect(dashboard.panels[1].repeatPanelId).toBe(2);
  });

  it("should set scopedVars on panels", function() {
    expect(dashboard.panels[0].scopedVars.apps.value).toBe("se1");
    expect(dashboard.panels[1].scopedVars.apps.value).toBe("se2");
    expect(dashboard.panels[2].scopedVars.apps.value).toBe("se3");
  });

  it("should place on first row and adjust width so all fit", function() {
    expect(dashboard.panels[0].gridPos).toMatchObject({
      x: 0,
      y: 0,
      h: 2,
      w: 8
    });
    expect(dashboard.panels[1].gridPos).toMatchObject({
      x: 8,
      y: 0,
      h: 2,
      w: 8
    });
    expect(dashboard.panels[2].gridPos).toMatchObject({
      x: 16,
      y: 0,
      h: 2,
      w: 8
    });
  });

  describe("After a second iteration", function() {
    beforeEach(function() {
      dashboard.panels[0].fill = 10;
      dashboard.processRepeats();
    });

    it("reused panel should copy properties from source", function() {
      expect(dashboard.panels[1].fill).toBe(10);
    });

    it("should have same panel count", function() {
      expect(dashboard.panels.length).toBe(3);
    });
  });

  describe("After a second iteration with different variable", function() {
    beforeEach(function() {
      dashboard.templating.list.push({
        name: "server",
        current: { text: "se1, se2, se3", value: ["se1"] },
        options: [{ text: "se1", value: "se1", selected: true }]
      });
      dashboard.panels[0].repeat = "server";
      dashboard.processRepeats();
    });

    it("should remove scopedVars value for last variable", function() {
      expect(dashboard.panels[0].scopedVars.apps).toBe(undefined);
    });

    it("should have new variable value in scopedVars", function() {
      expect(dashboard.panels[0].scopedVars.server.value).toBe("se1");
    });
  });

  describe("After a second iteration and selected values reduced", function() {
    beforeEach(function() {
      dashboard.templating.list[0].options[1].selected = false;
      dashboard.processRepeats();
    });

    it("should clean up repeated panel", function() {
      expect(dashboard.panels.length).toBe(2);
    });
  });

  describe("After a second iteration and panel repeat is turned off", function() {
    beforeEach(function() {
      dashboard.panels[0].repeat = null;
      dashboard.processRepeats();
    });

    it("should clean up repeated panel", function() {
      expect(dashboard.panels.length).toBe(1);
    });

    it("should remove scoped vars from reused panel", function() {
      expect(dashboard.panels[0].scopedVars).toBe(undefined);
    });
  });
});

describe("given dashboard with panel repeat in vertical direction", function() {
  var dashboard;

  beforeEach(function() {
    dashboard = new DashboardModel({
      panels: [
        {
          id: 2,
          repeat: "apps",
          repeatDirection: "v",
          gridPos: { x: 5, y: 0, h: 2, w: 8 }
        }
      ],
      templating: {
        list: [
          {
            name: "apps",
            current: {
              text: "se1, se2, se3",
              value: ["se1", "se2", "se3"]
            },
            options: [
              { text: "se1", value: "se1", selected: true },
              { text: "se2", value: "se2", selected: true },
              { text: "se3", value: "se3", selected: true },
              { text: "se4", value: "se4", selected: false }
            ]
          }
        ]
      }
    });
    dashboard.processRepeats();
  });

  it("should place on items on top of each other and keep witdh", function() {
    expect(dashboard.panels[0].gridPos).toMatchObject({
      x: 5,
      y: 0,
      h: 2,
      w: 8
    });
    expect(dashboard.panels[1].gridPos).toMatchObject({
      x: 5,
      y: 2,
      h: 2,
      w: 8
    });
    expect(dashboard.panels[2].gridPos).toMatchObject({
      x: 5,
      y: 4,
      h: 2,
      w: 8
    });
  });
});

describe("given dashboard with row repeat", function() {
  let dashboard, dashboardJSON;

  beforeEach(function() {
    dashboardJSON = {
      panels: [
        {
          id: 1,
          type: "row",
          gridPos: { x: 0, y: 0, h: 1, w: 24 },
          repeat: "apps"
        },
        { id: 2, type: "graph", gridPos: { x: 0, y: 1, h: 1, w: 6 } },
        { id: 3, type: "graph", gridPos: { x: 6, y: 1, h: 1, w: 6 } },
        { id: 4, type: "row", gridPos: { x: 0, y: 2, h: 1, w: 24 } },
        { id: 5, type: "graph", gridPos: { x: 0, y: 3, h: 1, w: 12 } }
      ],
      templating: {
        list: [
          {
            name: "apps",
            current: {
              text: "se1, se2",
              value: ["se1", "se2"]
            },
            options: [
              { text: "se1", value: "se1", selected: true },
              { text: "se2", value: "se2", selected: true },
              { text: "se3", value: "se3", selected: false }
            ]
          }
        ]
      }
    };
    dashboard = new DashboardModel(dashboardJSON);
    dashboard.processRepeats();
  });

  it("should not repeat only row", function() {
    const panel_types = _.map(dashboard.panels, "type");
    expect(panel_types).toEqual([
      "row",
      "graph",
      "graph",
      "row",
      "graph",
      "graph",
      "row",
      "graph"
    ]);
  });

  it("should set scopedVars for each panel", function() {
    dashboardJSON.templating.list[0].options[2].selected = true;
    dashboard = new DashboardModel(dashboardJSON);
    dashboard.processRepeats();

    expect(dashboard.panels[1].scopedVars).toMatchObject({
      apps: { text: "se1", value: "se1" }
    });
    expect(dashboard.panels[4].scopedVars).toMatchObject({
      apps: { text: "se2", value: "se2" }
    });

    const scopedVars = _.compact(
      _.map(dashboard.panels, panel => {
        return panel.scopedVars ? panel.scopedVars.apps.value : null;
      })
    );

    expect(scopedVars).toEqual([
      "se1",
      "se1",
      "se1",
      "se2",
      "se2",
      "se2",
      "se3",
      "se3",
      "se3"
    ]);
  });

  it("should repeat only configured row", function() {
    expect(dashboard.panels[6].id).toBe(4);
    expect(dashboard.panels[7].id).toBe(5);
  });

  it("should repeat only row if it is collapsed", function() {
    dashboardJSON.panels = [
      {
        id: 1,
        type: "row",
        collapsed: true,
        repeat: "apps",
        gridPos: { x: 0, y: 0, h: 1, w: 24 },
        panels: [
          { id: 2, type: "graph", gridPos: { x: 0, y: 1, h: 1, w: 6 } },
          { id: 3, type: "graph", gridPos: { x: 6, y: 1, h: 1, w: 6 } }
        ]
      },
      { id: 4, type: "row", gridPos: { x: 0, y: 1, h: 1, w: 24 } },
      { id: 5, type: "graph", gridPos: { x: 0, y: 2, h: 1, w: 12 } }
    ];
    dashboard = new DashboardModel(dashboardJSON);
    dashboard.processRepeats();

    const panel_types = _.map(dashboard.panels, "type");
    expect(panel_types).toEqual(["row", "row", "row", "graph"]);
    expect(dashboard.panels[0].panels).toHaveLength(2);
    expect(dashboard.panels[1].panels).toHaveLength(2);
  });

  it("should properly repeat multiple rows", function() {
    dashboardJSON.panels = [
      {
        id: 1,
        type: "row",
        gridPos: { x: 0, y: 0, h: 1, w: 24 },
        repeat: "apps"
      }, // repeat
      { id: 2, type: "graph", gridPos: { x: 0, y: 1, h: 1, w: 6 } },
      { id: 3, type: "graph", gridPos: { x: 6, y: 1, h: 1, w: 6 } },
      { id: 4, type: "row", gridPos: { x: 0, y: 2, h: 1, w: 24 } }, // don't touch
      { id: 5, type: "graph", gridPos: { x: 0, y: 3, h: 1, w: 12 } },
      {
        id: 6,
        type: "row",
        gridPos: { x: 0, y: 4, h: 1, w: 24 },
        repeat: "hosts"
      }, // repeat
      { id: 7, type: "graph", gridPos: { x: 0, y: 5, h: 1, w: 6 } },
      { id: 8, type: "graph", gridPos: { x: 6, y: 5, h: 1, w: 6 } }
    ];
    dashboardJSON.templating.list.push({
      name: "hosts",
      current: {
        text: "backend01, backend02",
        value: ["backend01", "backend02"]
      },
      options: [
        { text: "backend01", value: "backend01", selected: true },
        { text: "backend02", value: "backend02", selected: true },
        { text: "backend03", value: "backend03", selected: false }
      ]
    });
    dashboard = new DashboardModel(dashboardJSON);
    dashboard.processRepeats();

    const panel_types = _.map(dashboard.panels, "type");
    expect(panel_types).toEqual([
      "row",
      "graph",
      "graph",
      "row",
      "graph",
      "graph",
      "row",
      "graph",
      "row",
      "graph",
      "graph",
      "row",
      "graph",
      "graph"
    ]);

    expect(dashboard.panels[0].scopedVars["apps"].value).toBe("se1");
    expect(dashboard.panels[1].scopedVars["apps"].value).toBe("se1");
    expect(dashboard.panels[3].scopedVars["apps"].value).toBe("se2");
    expect(dashboard.panels[4].scopedVars["apps"].value).toBe("se2");
    expect(dashboard.panels[8].scopedVars["hosts"].value).toBe("backend01");
    expect(dashboard.panels[9].scopedVars["hosts"].value).toBe("backend01");
    expect(dashboard.panels[11].scopedVars["hosts"].value).toBe("backend02");
    expect(dashboard.panels[12].scopedVars["hosts"].value).toBe("backend02");
  });

  it("should assign unique ids for repeated panels", function() {
    dashboardJSON.panels = [
      {
        id: 1,
        type: "row",
        collapsed: true,
        repeat: "apps",
        gridPos: { x: 0, y: 0, h: 1, w: 24 },
        panels: [
          { id: 2, type: "graph", gridPos: { x: 0, y: 1, h: 1, w: 6 } },
          { id: 3, type: "graph", gridPos: { x: 6, y: 1, h: 1, w: 6 } }
        ]
      },
      { id: 4, type: "row", gridPos: { x: 0, y: 1, h: 1, w: 24 } },
      { id: 5, type: "graph", gridPos: { x: 0, y: 2, h: 1, w: 12 } }
    ];
    dashboard = new DashboardModel(dashboardJSON);
    dashboard.processRepeats();

    const panel_ids = _.flattenDeep(
      _.map(dashboard.panels, panel => {
        let ids = [];
        if (panel.panels && panel.panels.length) {
          ids = _.map(panel.panels, "id");
        }
        ids.push(panel.id);
        return ids;
      })
    );
    expect(panel_ids.length).toEqual(_.uniq(panel_ids).length);
  });
});
