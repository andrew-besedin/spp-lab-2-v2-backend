import cardsService, { CardNotFoundError, InvalidTransitionError } from "../services/cards.service";
import { CreateCardDto } from "../interfaces/cards/CreateCardDto";
import { UpdateCardDto, UpdateCardParams } from "../interfaces/cards/UpdateCardDto";
import { AddCommentDto, AddCommentParams } from "../interfaces/cards/AddCommentDto";
import { GetCardParams } from "../interfaces/cards/GetCardDto";
import { tryCatch } from "../utils/utils";

class CardsController {
    list = tryCatch(async (req, res) => {
        const cards = await cardsService.list();
        res.status(200).json({ success: true, data: cards });
    });

    get = tryCatch<GetCardParams>(async (req, res) => {
        const card = await cardsService.getDetail(Number(req.params.id));

        if (!card) {
            res.status(404).json({ success: false, data: "CARD_NOT_FOUND" });
            return;
        }

        res.status(200).json({ success: true, data: card });
    });

    create = tryCatch<unknown, unknown, CreateCardDto>(async (req, res) => {
        const card = await cardsService.create(req.body, req.user!.id);
        res.status(200).json({ success: true, data: card });
    });

    update = tryCatch<UpdateCardParams, unknown, UpdateCardDto>(async (req, res) => {
        try {
            const card = await cardsService.update(Number(req.params.id), req.body, req.user!.id);
            res.status(200).json({ success: true, data: card });
        } catch (err) {
            if (err instanceof CardNotFoundError) {
                res.status(404).json({ success: false, data: "CARD_NOT_FOUND" });
                return;
            }

            if (err instanceof InvalidTransitionError) {
                res.status(200).json({ success: false, data: "INVALID_TRANSITION" });
                return;
            }

            throw err;
        }
    });

    addComment = tryCatch<AddCommentParams, unknown, AddCommentDto>(async (req, res) => {
        try {
            const comment = await cardsService.addComment(Number(req.params.id), req.user!.id, req.body.body);
            res.status(200).json({ success: true, data: comment });
        } catch (err) {
            if (err instanceof CardNotFoundError) {
                res.status(404).json({ success: false, data: "CARD_NOT_FOUND" });
                return;
            }

            throw err;
        }
    });
}

const cardsController = new CardsController();
export default cardsController;
