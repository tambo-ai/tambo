import UserForm from "./components/UserForm";
import DataTable from "./components/DataTable";
import InfoCard from "./components/InfoCard";

export default {
  components: {
    UserForm: {
      description: "Use when user wants a signup or input form",
      component: UserForm
    },
    DataTable: {
      description: "Use when user wants a table or analytics data",
      component: DataTable
    },
    InfoCard: {
      description: "Use when user wants to display information",
      component: InfoCard
    }
  }
};
