export interface PriorityItem {
    id: string;
    type: string;
    title: string;
    assignee: string;
    deadline: string;
    status: 'atrasado' | 'hoje';
}

export interface FeedItem {
    id: string;
    user: string;
    initials: string;
    action: string;
    target: string;
    time: string;
}

export interface ChartDataPoint {
    name: string;
    value: number;
    color: string;
}

export interface DashboardEmpresaData {
    executionTodayTotal: number;
    executionTodayCompleted: number;
    pendingCritical: number;
    activeTeam: number;
    prioritiesList: PriorityItem[];
    feedList: FeedItem[];
    chartData: ChartDataPoint[];
}
