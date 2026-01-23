using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Application.Validators;
using PointRealm.Server.Common;
using PointRealm.Server.Common.Errors;
using PointRealm.Server.Contracts;
using PointRealm.Server.Domain.Entities;

namespace PointRealm.Server.Application.Services;

public sealed class RealmService : IRealmService
{
    private readonly IRealmRepository _repository;
    private readonly IRealmNameValidator _validator;

    public RealmService(IRealmRepository repository, IRealmNameValidator validator)
    {
        _repository = repository;
        _validator = validator;
    }

    public async Task<Result<RealmDto>> CreateAsync(string name, CancellationToken cancellationToken)
    {
        if (!_validator.IsValid(name, out var errorMessage))
        {
            return Result<RealmDto>.Failure(Error.Validation(errorMessage ?? "Invalid name."));
        }

        var realm = Realm.Create(name);
        await _repository.AddAsync(realm, cancellationToken);

        return Result<RealmDto>.Success(RealmDto.From(realm));
    }

    public async Task<Result<RealmDto>> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        var realm = await _repository.GetByIdAsync(id, cancellationToken);

        if (realm is null)
        {
            return Result<RealmDto>.Failure(Error.NotFound("Realm not found."));
        }

        return Result<RealmDto>.Success(RealmDto.From(realm));
    }
}
