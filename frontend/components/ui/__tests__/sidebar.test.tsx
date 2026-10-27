import { fireEvent, render, screen } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "../sidebar";

jest.mock("@/hooks/use-mobile", () => ({ useIsMobile: jest.fn() }));
const mockedMobile = useIsMobile as jest.Mock;

function SidebarState() {
  const { state, openMobile } = useSidebar();
  return <output>{`${state}:${openMobile}`}</output>;
}

beforeEach(() => mockedMobile.mockReturnValue(false));

it("toggles the desktop sidebar with trigger, rail, and keyboard shortcut", () => {
  const onClick = jest.fn();
  render(
    <SidebarProvider defaultOpen>
      <SidebarState />
      <Sidebar collapsible="icon" data-testid="sidebar">
        <SidebarTrigger onClick={onClick} />
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  );

  const sidebar = screen.getByTestId("sidebar").closest("[data-state]");
  expect(sidebar).toHaveAttribute("data-state", "expanded");
  fireEvent.click(screen.getAllByRole("button", { name: "Toggle Sidebar" })[0]);
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(sidebar).toHaveAttribute("data-state", "collapsed");
  expect(sidebar).toHaveAttribute("data-collapsible", "icon");
  expect(document.cookie).toContain("sidebar:state=false");
  fireEvent.click(screen.getAllByRole("button", { name: "Toggle Sidebar" })[1]);
  expect(sidebar).toHaveAttribute("data-state", "expanded");
  fireEvent.keyDown(window, { key: "b", ctrlKey: true });
  expect(sidebar).toHaveAttribute("data-state", "collapsed");
});

it("keeps a controlled sidebar in sync with its callback", () => {
  const onOpenChange = jest.fn();
  render(
    <SidebarProvider open={false} onOpenChange={onOpenChange}>
      <SidebarState />
      <SidebarTrigger />
    </SidebarProvider>
  );

  expect(screen.getByText("collapsed:false")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
  expect(onOpenChange).toHaveBeenCalledWith(true);
});

it("opens the mobile sidebar without changing its desktop state", () => {
  mockedMobile.mockReturnValue(true);
  render(
    <SidebarProvider>
      <SidebarState />
      <SidebarTrigger />
      <Sidebar>Navigation</Sidebar>
    </SidebarProvider>
  );

  fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
  expect(screen.getByText("expanded:true")).toBeInTheDocument();
  expect(screen.getByText("Navigation")).toBeInTheDocument();
});

it("renders sidebar groups and menu actions with accessible controls", () => {
  render(
    <SidebarProvider defaultOpen={false}>
      <SidebarInset data-testid="inset">
        <Sidebar collapsible="none">
          <SidebarHeader>Header</SidebarHeader>
          <SidebarInput aria-label="Filter navigation" />
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupAction aria-label="Add" />
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive tooltip="Users">
                      Users
                    </SidebarMenuButton>
                    <SidebarMenuAction aria-label="Edit" showOnHover />
                    <SidebarMenuBadge>3</SidebarMenuBadge>
                  </SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="/admin" isActive size="sm">
                        Details
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>Footer</SidebarFooter>
        </Sidebar>
      </SidebarInset>
    </SidebarProvider>
  );

  expect(screen.getByRole("main")).toHaveAttribute("data-testid", "inset");
  expect(screen.getByRole("button", { name: "Users" })).toHaveAttribute(
    "data-active",
    "true"
  );
  expect(screen.getByRole("link", { name: "Details" })).toHaveAttribute(
    "href",
    "/admin"
  );
  expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  expect(
    screen.getByRole("textbox", { name: "Filter navigation" })
  ).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
});

it("requires a provider for sidebar controls", () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
  expect(() => render(<SidebarTrigger />)).toThrow(
    "useSidebar must be used within a SidebarProvider"
  );
  log.mockRestore();
});
