import { RootState } from "@/store";
import { useSelector } from "react-redux";

const CreateUserFooter = () => {
  const { currentPageUserCreate } = useSelector(
    (state: RootState) => state.user
  );
  return (
    <div className="w-full flex justify-center">
      <div className="flex flex-col items-center justify-around w-3/5 gap-y-1">
        <div className="w-full h-[10px] md:h-[14px] bg-secondary-foreground/30 overflow-hidden rounded-lg">
          <div
            className={`${
              currentPageUserCreate === 1
                ? "w-1/3"
                : currentPageUserCreate === 2
                  ? "w-2/3"
                  : "w-full"
            }     
        } rounded-l-lg bg-[#3A5DD9] h-full`}
          ></div>
        </div>
        <p>{currentPageUserCreate}/3</p>
      </div>
    </div>
  );
};

export default CreateUserFooter;
