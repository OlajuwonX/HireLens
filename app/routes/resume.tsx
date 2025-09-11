import {useParams} from "react-router";

const Resume = () => {

    const {id} = useParams(); //destructure id coming from react-router

    return (
        <div>Resume</div>
    )
}
export default Resume
